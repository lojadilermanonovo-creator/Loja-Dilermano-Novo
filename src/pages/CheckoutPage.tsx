import React, { useState, useEffect } from 'react';
import { useCart } from '@/src/contexts/CartContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { db, functions } from '@/src/integrations/firebase/client';
import { collection, addDoc, serverTimestamp, runTransaction, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, Truck, AlertCircle, Tag, MessageCircle, Plus, CreditCard, QrCode } from 'lucide-react';
import { calculateShippingMock } from '@/src/utils/shipping';
import { useStoreWhatsapp } from '@/src/hooks/useStoreWhatsapp';

interface SavedAddress {
  id: string;
  name: string;
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart, appliedCoupon, discountAmount } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    name: '',
    receiverName: '',
    receiverPhone: '',
    fullName: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      if (!user) return;
      setLoadingAddresses(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const list: SavedAddress[] = userData.addresses || [];
          setSavedAddresses(list);
          
          if (list.length > 0) {
            // Find default address, else use first
            const defaultAddr = list.find(a => a.isDefault) || list[0];
            setSelectedAddressId(defaultAddr.id);
            setAddress({
              name: defaultAddr.name || '',
              receiverName: defaultAddr.receiverName || user.displayName || userData.fullName || '',
              receiverPhone: defaultAddr.receiverPhone || '',
              fullName: defaultAddr.receiverName || user.displayName || userData.fullName || '',
              zipCode: defaultAddr.zipCode,
              street: defaultAddr.street,
              number: defaultAddr.number,
              complement: defaultAddr.complement || '',
              neighborhood: defaultAddr.neighborhood,
              city: defaultAddr.city,
              state: defaultAddr.state
            });
          }
        }
      } catch (err) {
        console.error('Erro ao carregar endereços do usuário:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchUserAddresses();
  }, [user]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'manual') {
      setAddress({
        name: '',
        receiverName: '',
        receiverPhone: '',
        fullName: '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      });
      return;
    }

    const selected = savedAddresses.find(a => a.id === addrId);
    if (selected) {
      setAddress({
        name: selected.name || '',
        receiverName: selected.receiverName || '',
        receiverPhone: selected.receiverPhone || '',
        fullName: selected.receiverName || user?.displayName || '',
        zipCode: selected.zipCode,
        street: selected.street,
        number: selected.number,
        complement: selected.complement || '',
        neighborhood: selected.neighborhood,
        city: selected.city,
        state: selected.state
      });
    }
  };

  // Format CEP dynamically (99999-999)
  const formatCEP = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 5) {
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    return raw;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setAddress(prev => ({ ...prev, zipCode: formatted }));

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (!response.ok) throw new Error('ViaCEP offline');
        const data = await response.json();
        if (data.erro) {
          toast.warning('CEP não encontrado. Por favor, preencha manualmente.');
        } else {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }));
          toast.success('Endereço autocompletado com sucesso!');
        }
      } catch (err) {
        console.warn('ViaCEP API error:', err);
        toast.warning('Não foi possível buscar o CEP automaticamente. Você pode preenchê-lo manualmente.');
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // Shipping dynamic states
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<any | null>(null);
  const [negotiatedShippingPrice, setNegotiatedShippingPrice] = useState<number>(0);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const storeWhatsapp = useStoreWhatsapp();

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'stripe'>('pix');
  const [stripeConfig, setStripeConfig] = useState<{ active: boolean; publishableKey: string; mode: string } | null>(null);
  const [stripeDebugInfo, setStripeDebugInfo] = useState<{
    firestoreActive: string;
    apiActive: string;
    publishableKeyLoaded: string;
  }>({
    firestoreActive: 'Buscando...',
    apiActive: 'Buscando...',
    publishableKeyLoaded: 'Buscando...',
  });

  // Fetch Stripe Config
  useEffect(() => {
    const fetchStripeConfig = async () => {
      let finalActive = false;
      let finalKey = '';
      let finalMode = 'sandbox';

      console.log('--- [Stripe Checkout Debug LOG] ---');

      // 1. Try reading directly from Firestore settings/stripe_public (Client SDK - 100% reliable)
      try {
        const docRef = doc(db, 'settings', 'stripe_public');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('[Stripe Debug] Configurações lidas do Firestore (settings/stripe_public):', data);
          setStripeDebugInfo(prev => ({
            ...prev,
            firestoreActive: data.active ? 'Sim' : 'Não',
            publishableKeyLoaded: data.publishableKey ? `Sim (${data.publishableKey.substring(0, 15)}...)` : 'Não (Vazia)'
          }));
          
          if (data.active) {
            finalActive = true;
            finalKey = data.publishableKey || '';
            finalMode = data.mode || 'sandbox';
          }
        } else {
          console.log('[Stripe Debug] Documento settings/stripe_public não existe no Firestore.');
          setStripeDebugInfo(prev => ({ ...prev, firestoreActive: 'Não encontrado' }));
        }
      } catch (err: any) {
        console.error('[Stripe Debug] Erro ao ler settings/stripe_public do Firestore:', err);
        setStripeDebugInfo(prev => ({ ...prev, firestoreActive: `Erro: ${err.message || err}` }));
      }

      // 2. Try reading from backend API /api/stripe/config
      try {
        const res = await fetch('/api/stripe/config');
        if (res.ok) {
          const data = await res.json();
          console.log('[Stripe Debug] Resposta da API /api/stripe/config:', data);
          setStripeDebugInfo(prev => ({
            ...prev,
            apiActive: data.active ? 'Sim' : 'Não',
            publishableKeyLoaded: data.publishableKey ? `Sim (${data.publishableKey.substring(0, 15)}...)` : prev.publishableKeyLoaded === 'Buscando...' ? 'Não' : prev.publishableKeyLoaded
          }));

          if (data.active) {
            finalActive = true;
            if (!finalKey) finalKey = data.publishableKey || '';
            finalMode = data.mode || 'sandbox';
          }
        } else {
          const text = await res.text();
          console.error('[Stripe Debug] Resposta com erro da API /api/stripe/config:', res.status, text);
          setStripeDebugInfo(prev => ({ ...prev, apiActive: `Erro ${res.status}` }));
        }
      } catch (err: any) {
        console.error('[Stripe Debug] Erro na requisição à API /api/stripe/config:', err);
        setStripeDebugInfo(prev => ({ ...prev, apiActive: `Erro: ${err.message || err}` }));
      }

      // 3. Apply state
      console.log('[Stripe Debug] Valor final recebido pelo CheckoutPage:', { active: finalActive, publishableKey: finalKey, mode: finalMode });
      setStripeConfig({ active: finalActive, publishableKey: finalKey, mode: finalMode });
      
      if (finalActive) {
        setPaymentMethod('stripe');
      } else {
        setPaymentMethod('pix');
      }
    };
    
    fetchStripeConfig();
  }, []);

  // Monitor Zip Code pattern (8 digits) to calculate shipping
  useEffect(() => {
    const cleanZip = address.zipCode.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      calculateShippingOptions(cleanZip);
    } else {
      setShippingOptions([]);
      setSelectedShippingOption(null);
    }
  }, [address.zipCode]);

  const calculateShippingOptions = async (zip: string) => {
    setCalculatingShipping(true);
    setSelectedShippingOption(null);
    setShippingOptions([]);
    try {
      // Offline Local shipping system (No Firebase Cloud Functions / No external endpoints)
      const options = calculateShippingMock(zip);
      setShippingOptions(options);
    } catch (err: any) {
      console.error("[Checkout] Erro ao calcular frete local:", err);
      toast.error(err.message || 'Erro ao calcular frete local');
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Você precisa estar logado para finalizar a compra');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!selectedShippingOption) {
      toast.error('Selecione uma opção de frete para prosseguir.');
      return;
    }

    setLoading(true);
    try {
      // Validate all items against Firestore stock
      for (const item of items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          throw new Error(`O produto "${item.name}" não foi encontrado em nosso catálogo.`);
        }
        
        const productData = productSnap.data();
        
        if (productData.isActive === false) {
          throw new Error(`O produto "${item.name}" está indisponível para compra no momento.`);
        }

        let availableStock = Number(productData.stockQuantity) || 0;
        let itemAttrString = '';

        if (productData.variations && productData.variations.length > 0 && item.attributes) {
          const sizeAttr = item.attributes['Tamanho'] || '';
          const colorAttr = item.attributes['Cor'] || '';
          itemAttrString = ` (${sizeAttr}${sizeAttr && colorAttr ? ' - ' : ''}${colorAttr})`;
          
          const matchingVar = productData.variations.find((v: any) => 
            (v.size || '').toLowerCase() === sizeAttr.toLowerCase() &&
            (v.color || '').toLowerCase() === colorAttr.toLowerCase()
          );
          
          availableStock = matchingVar ? (Number(matchingVar.stockQuantity) || 0) : 0;
        }

        if (item.quantity > availableStock) {
          if (availableStock <= 0) {
            throw new Error(`O produto "${item.name}"${itemAttrString} está esgotado.`);
          } else {
            throw new Error(`O produto "${item.name}"${itemAttrString} possui apenas ${availableStock} un. disponíveis em estoque, mas você possui ${item.quantity} no carrinho.`);
          }
        }
      }

      const shippingCost = selectedShippingOption 
        ? (selectedShippingOption.id === 'negotiated' ? negotiatedShippingPrice : selectedShippingOption.price) 
        : 0;
      const totalAmount = Math.max(subtotal - discountAmount, 0) + shippingCost;

      const orderData: any = {
        userId: user.uid,
        items,
        subtotal,
        shippingCost,
        shippingOption: selectedShippingOption ? {
          id: selectedShippingOption.id,
          name: selectedShippingOption.name,
          days: selectedShippingOption.days,
          company: selectedShippingOption.company || selectedShippingOption.name
        } : null,
        ...(selectedShippingOption?.id === 'negotiated' ? {
          shippingType: "negotiated",
          shippingStatus: "awaiting_negotiation"
        } : {}),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        couponType: appliedCoupon ? appliedCoupon.type : null,
        couponValue: appliedCoupon ? appliedCoupon.value : null,
        discountAmount: discountAmount,
        total: totalAmount,
        shippingAddress: {
          ...address,
          email: user.email || '',
        },
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod,
        createdAt: serverTimestamp(),
        orderNumber: `DI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`
      };

      let orderId = '';

      if (appliedCoupon) {
        // Concurrency Control using Firestore Transaction
        await runTransaction(db, async (transaction) => {
          const couponRef = doc(db, 'coupons', appliedCoupon.code);
          const couponSnap = await transaction.get(couponRef);

          if (!couponSnap.exists()) {
            throw new Error('Cupom não encontrado ou indisponível.');
          }

          const currentCoupon = couponSnap.data();

          if (!currentCoupon.isActive) {
            throw new Error('O cupom aplicado não está mais ativo.');
          }

          if (currentCoupon.maxUses !== undefined && currentCoupon.usedCount !== undefined) {
            if (currentCoupon.usedCount >= currentCoupon.maxUses) {
              throw new Error('O limite de uso deste cupom se esgotou enquanto você finalizava a compra.');
            }
          }

          if (currentCoupon.minOrderValue !== undefined && subtotal < currentCoupon.minOrderValue) {
            throw new Error(`Este cupom requer um valor mínimo de compra de R$ ${Number(currentCoupon.minOrderValue).toFixed(2)}.`);
          }

          // Atomically update coupon consumed slots count
          transaction.update(couponRef, {
            usedCount: (currentCoupon.usedCount || 0) + 1
          });

          // Atomically create the order document
          const newOrderRef = doc(collection(db, 'orders'));
          transaction.set(newOrderRef, orderData);
          orderId = newOrderRef.id;
        });
      } else {
        // Simple order creation when no coupon is applied
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        orderId = docRef.id;
      }
      
      if (paymentMethod === 'stripe') {
        toast.info('Iniciando pagamento seguro do Stripe...');
        
        // Create a copy of orderData for JSON serialization (as serverTimestamp cannot be serialized)
        const serializableOrderData = {
          ...orderData,
          createdAt: new Date().toISOString()
        };

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, orderData: serializableOrderData }),
        });
        const sessionData = await response.json();
        if (response.ok && sessionData.url) {
          clearCart();
          window.location.href = sessionData.url;
          return;
        } else {
          throw new Error(sessionData.error || 'Erro ao criar sessão de pagamento no Stripe.');
        }
      } else {
        toast.success('Pedido criado com sucesso! Siga as instruções de pagamento.');
        clearCart();
        navigate(`/checkout/success?orderId=${orderId}`);
      }

    } catch (error: any) {
      console.error('Erro no checkout:', error);
      toast.error(error.message || 'Erro ao processar checkout');
    } finally {
      setLoading(false);
    }
  };

  const selectedShippingPrice = selectedShippingOption 
    ? (selectedShippingOption.id === 'negotiated' ? negotiatedShippingPrice : selectedShippingOption.price) 
    : 0;
  const finalTotalAmount = Math.max(subtotal - discountAmount, 0) + selectedShippingPrice;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-black tracking-tighter uppercase mb-12 flex items-center gap-2">
        <Truck className="h-9 w-9 text-blue-600" />
        Checkout do Pedido
      </h1>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" /> Endereço de Entrega
            </h2>

            {user && savedAddresses.length > 0 && (
              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" /> Endereços Cadastrados ({savedAddresses.length})
                  </span>
                  {loadingAddresses && <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-1 relative group ${
                          isSelected
                            ? 'border-blue-600 bg-white ring-2 ring-blue-100 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {addr.isDefault && (
                          <span className="absolute top-2.5 right-2 text-[8px] font-extrabold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Principal
                          </span>
                        )}
                        <p className={`font-extrabold text-xs line-clamp-1 pr-12 transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>
                          {addr.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          Para: {addr.receiverName}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal line-clamp-2 mt-1">
                          {addr.street}, {addr.number} {addr.complement && `(${addr.complement})`} - {addr.neighborhood}, {addr.city} - {addr.state}
                        </p>
                        <p className="text-[9px] font-mono font-bold text-slate-400 mt-1">CEP: {addr.zipCode}</p>
                      </div>
                    );
                  })}
                  
                  <div
                    onClick={() => handleSelectSavedAddress('manual')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[100px] border-dashed ${
                      selectedAddressId === 'manual'
                        ? 'border-blue-600 bg-white ring-2 ring-blue-100 shadow-sm text-blue-600'
                        : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Outro Endereço
                    </span>
                    <p className="text-[9px] text-slate-400 text-center font-semibold mt-0.5 leading-tight">
                      Preencher campos abaixo manualmente
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="addrName" className="text-[11px] font-bold text-slate-600">Identificação do Endereço *</Label>
                <Input 
                  id="addrName" 
                  required 
                  placeholder="Ex: Minha Casa, Escritório, Avós" 
                  value={address.name} 
                  onChange={e => setAddress({ ...address, name: e.target.value })} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receiverName" className="text-[11px] font-bold text-slate-600">Destinatário *</Label>
                <Input 
                  id="receiverName" 
                  required 
                  placeholder="Nome de quem recebe" 
                  value={address.receiverName} 
                  onChange={e => setAddress({ ...address, receiverName: e.target.value, fullName: e.target.value })} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receiverPhone" className="text-[11px] font-bold text-slate-600">Telefone *</Label>
                <Input 
                  id="receiverPhone" 
                  required 
                  placeholder="Ex: (11) 99999-9999" 
                  value={address.receiverPhone} 
                  onChange={e => setAddress({ ...address, receiverPhone: e.target.value })} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm font-mono" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zipCode" className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  CEP *
                  {loadingCep && <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />}
                </Label>
                <Input 
                  id="zipCode" 
                  required 
                  placeholder="00000-000" 
                  value={address.zipCode} 
                  onChange={handleCepChange} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm font-mono" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="number" className="text-[11px] font-bold text-slate-600">Número *</Label>
                <Input 
                  id="number" 
                  required 
                  placeholder="Ex: 123, S/N" 
                  value={address.number} 
                  onChange={e => setAddress({ ...address, number: e.target.value })} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm" 
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="street" className="text-[11px] font-bold text-slate-600">Rua *</Label>
                <Input 
                  id="street" 
                  required 
                  placeholder="Logradouro" 
                  value={address.street} 
                  onChange={e => setAddress({ ...address, street: e.target.value })} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm" 
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="complement" className="text-[11px] font-bold text-slate-600">Complemento (opcional)</Label>
                <Input 
                  id="complement" 
                  placeholder="Ex: Apto 42, Bloco B" 
                  value={address.complement} 
                  onChange={e => setAddress({ ...address, complement: e.target.value })} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="neighborhood" className="text-[11px] font-bold text-slate-600">Bairro *</Label>
                <Input 
                  id="neighborhood" 
                  required 
                  placeholder="Bairro" 
                  value={address.neighborhood} 
                  onChange={e => setAddress({ ...address, neighborhood: e.target.value })} 
                  className="bg-white rounded-xl border-slate-200 h-10 text-sm" 
                />
              </div>

              <div className="grid grid-cols-3 sm:col-span-1 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="city" className="text-[11px] font-bold text-slate-600">Cidade *</Label>
                  <Input 
                    id="city" 
                    required 
                    placeholder="Cidade" 
                    value={address.city} 
                    onChange={e => setAddress({ ...address, city: e.target.value })} 
                    className="bg-white rounded-xl border-slate-200 h-10 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stateCode" className="text-[11px] font-bold text-slate-600">UF *</Label>
                  <Input 
                    id="stateCode" 
                    required 
                    placeholder="UF" 
                    maxLength={2} 
                    value={address.state} 
                    onChange={e => setAddress({ ...address, state: e.target.value.toUpperCase() })} 
                    className="bg-white rounded-xl border-slate-200 h-10 text-xs uppercase text-center font-bold" 
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Shipping Selection Row */}
            <div className="pt-4 border-t border-slate-100">
              {calculatingShipping && (
                <div className="text-xs text-blue-600 font-semibold animate-pulse py-4 flex items-center gap-2 justify-center bg-blue-50/50 rounded-xl border border-blue-105">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Calculando opções de frete...</span>
                </div>
              )}

              {shippingOptions.length > 0 && !calculatingShipping && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Formas de Envio Disponíveis</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {shippingOptions.map((opt: any) => {
                      const isSelected = selectedShippingOption?.id === opt.id;
                      return (
                        <div 
                          key={opt.id} 
                          onClick={() => setSelectedShippingOption(opt)}
                          className={`flex justify-between items-center p-3.5 border rounded-2xl cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50/40 border-2 ring-1 ring-blue-500/20 shadow-sm' 
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              checked={isSelected} 
                              onChange={() => setSelectedShippingOption(opt)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                            />
                            <div className="text-left">
                              <span className="font-bold text-xs block text-slate-800">{opt.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {opt.id === 'negotiated' ? (opt.description || 'Combine o valor diretamente com nossa equipe.') : `${opt.days} dias úteis`}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opt.id === 'negotiated' ? negotiatedShippingPrice : opt.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Negotiation block */}
                  {selectedShippingOption?.id === 'negotiated' && (
                    <div className="mt-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in-50 duration-200">
                      <h4 className="text-sm font-extrabold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" /> Negociar Frete
                      </h4>
                      <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
                        Entre em contato pelo WhatsApp para combinar o valor do frete e digite o valor acordado no campo abaixo:
                      </p>

                      <div className="space-y-1.5">
                        <Label htmlFor="negotiatedPriceInput" className="text-[11px] font-bold text-emerald-800">
                          Valor do Frete Negociado (R$) *
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">R$</span>
                          <Input
                            id="negotiatedPriceInput"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={negotiatedShippingPrice === 0 ? '' : negotiatedShippingPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setNegotiatedShippingPrice(isNaN(val) ? 0 : val);
                            }}
                            className="pl-10 bg-white border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 h-11 text-sm font-bold text-emerald-900"
                          />
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${storeWhatsapp}?text=${encodeURIComponent("Olá! Gostaria de negociar o frete do meu pedido.")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] text-xs uppercase"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" /> Falar no WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}

              {address.zipCode.replace(/\D/g, '').length === 8 && shippingOptions.length === 0 && !calculatingShipping && (
                <div className="text-xs text-amber-600 font-semibold py-3 flex items-center gap-2 justify-center bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Erro ao obter opções para este CEP. Insira um CEP válido.</span>
                </div>
              )}
            </div>
          </section>

          {/* Método de Pagamento */}
          {stripeConfig?.active && (
            <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                  <CreditCard className="h-5 w-5 text-blue-600" /> Método de Pagamento
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Escolha como prefere realizar o pagamento do seu pedido.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stripe Option */}
                <div
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-4 ${
                    paymentMethod === 'stripe'
                      ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-100 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border ${paymentMethod === 'stripe' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-slate-250'}`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-blue-600 tracking-wider">Cartão de Crédito</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-0.5">Pagar via Stripe</span>
                    <span className="text-[11px] text-slate-500 leading-normal block mt-1">
                      Pague via Stripe Checkout seguro. Confirmação instantânea!
                    </span>
                  </div>
                </div>

                {/* Pix Option */}
                <div
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-4 ${
                    paymentMethod === 'pix'
                      ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-100 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border ${paymentMethod === 'pix' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-slate-250'}`}>
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-blue-600 tracking-wider">PIX Direto</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-0.5">Chave Pix copia e cola</span>
                    <span className="text-[11px] text-slate-500 leading-normal block mt-1">
                      Pague via Pix copia e cola ou QR Code. Liberação rápida do pedido.
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Debug Stripe Info (Temporary as requested by user) */}
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-xs font-mono text-slate-600 space-y-2 mt-4 shadow-sm">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Diagnóstico Stripe (Temporário)
            </div>
            <div>Stripe Ativo (Firestore `stripe_public`): <span className={stripeDebugInfo.firestoreActive === 'Sim' ? 'text-green-600 font-bold' : 'text-rose-600'}>{stripeDebugInfo.firestoreActive}</span></div>
            <div>Stripe Ativo (API `/api/stripe/config`): <span className={stripeDebugInfo.apiActive === 'Sim' ? 'text-green-600 font-bold' : 'text-rose-600'}>{stripeDebugInfo.apiActive}</span></div>
            <div>Publishable Key carregada: <span className="font-semibold text-slate-700">{stripeDebugInfo.publishableKeyLoaded}</span></div>
            <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">Este painel é exibido temporariamente para identificar em qual etapa as credenciais Stripe estão sendo carregadas.</div>
          </div>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-800 pb-4">Resumo da Compra</h2>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.quantity}x {item.name}</span>
                  <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}</span>
                </div>
              ))}
              
              <Separator className="bg-slate-800" />
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-rose-400 font-semibold bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/30">
                  <span className="flex items-center gap-1.5 uppercase text-xs font-extrabold text-rose-300">
                    <Tag className="h-3.5 w-3.5 text-rose-400" />
                    Cupom ({appliedCoupon?.code})
                  </span>
                  <span className="font-mono">
                    -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Frete Integrado</span>
                <span className="font-semibold text-blue-400">
                  {selectedShippingOption 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedShippingPrice)
                    : "Selecione o CEP de entrega"}
                </span>
              </div>

              <Separator className="bg-slate-800" />

              <div className="flex justify-between text-lg font-black pt-2">
                <span>Total Final</span>
                <span className="text-blue-400 font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotalAmount)}</span>
              </div>
            </div>

            <Button type="submit" disabled={loading || !selectedShippingOption} className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-850 rounded-2xl font-bold text-lg cursor-pointer transition-all">
              {loading ? 'Processando...' : 'Finalizar Pedido'}
            </Button>
            
            <p className="text-[10px] text-center text-slate-400">
              {paymentMethod === 'stripe'
                ? 'Ao clicar em finalizar, você será redirecionado com total segurança para o Stripe Checkout para pagar com Cartão de Crédito.'
                : 'Ao clicar em finalizar, você verá a chave PIX e as instruções para conclusão do seu pagamento.'}
            </p>
          </section>
        </div>
      </form>
    </div>
  );
}
