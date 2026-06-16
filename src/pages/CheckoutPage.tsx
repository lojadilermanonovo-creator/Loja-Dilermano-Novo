import React, { useState, useEffect } from 'react';
import { useCart } from '@/src/contexts/CartContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { db, functions } from '@/src/integrations/firebase/client';
import { collection, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, Truck, AlertCircle, Tag } from 'lucide-react';
import { calculateShippingMock } from '@/src/utils/shipping';

export default function CheckoutPage() {
  const { items, subtotal, clearCart, appliedCoupon, discountAmount } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Shipping dynamic states
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<any | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

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
      const shippingCost = selectedShippingOption ? selectedShippingOption.price : 0;
      const totalAmount = Math.max(subtotal - discountAmount, 0) + shippingCost;

      const orderData = {
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
      
      toast.success('Pedido criado com sucesso! Siga as instruções de pagamento.');
      
      clearCart();
      navigate(`/checkout/success?orderId=${orderId}`);

    } catch (error: any) {
      console.error('Erro no checkout:', error);
      toast.error(error.message || 'Erro ao processar checkout');
    } finally {
      setLoading(false);
    }
  };

  const selectedShippingPrice = selectedShippingOption ? selectedShippingOption.price : 0;
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold text-slate-600">Nome Completo</Label>
                <Input id="fullName" required value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} className="rounded-xl border-slate-200 h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-xs font-bold text-slate-600">CEP</Label>
                <Input id="zipCode" placeholder="Ex: 00000-000" required value={address.zipCode} onChange={e => setAddress({...address, zipCode: e.target.value})} className="rounded-xl border-slate-200 h-10 font-mono" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street" className="text-xs font-bold text-slate-600">Rua</Label>
                <Input id="street" required value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="rounded-xl border-slate-200 h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number" className="text-xs font-bold text-slate-600">Número</Label>
                <Input id="number" required value={address.number} onChange={e => setAddress({...address, number: e.target.value})} className="rounded-xl border-slate-200 h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement" className="text-xs font-bold text-slate-600">Complemento</Label>
                <Input id="complement" value={address.complement} onChange={e => setAddress({...address, complement: e.target.value})} className="rounded-xl border-slate-200 h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-xs font-bold text-slate-600">Bairro</Label>
                <Input id="neighborhood" required value={address.neighborhood} onChange={e => setAddress({...address, neighborhood: e.target.value})} className="rounded-xl border-slate-200 h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-bold text-slate-600">Cidade</Label>
                <Input id="city" required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="rounded-xl border-slate-200 h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs font-bold text-slate-600">Estado</Label>
                <Input id="state" required value={address.state} onChange={e => setAddress({...address, state: e.target.value})} className="rounded-xl border-slate-200 h-10" />
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
                              <span className="text-[10px] text-slate-400">{opt.days} dias úteis</span>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opt.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
              Ao clicar em finalizar, você verá a chave PIX e as instruções para conclusão do seu pagamento.
            </p>
          </section>
        </div>
      </form>
    </div>
  );
}
