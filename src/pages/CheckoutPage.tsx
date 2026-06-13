import React, { useState } from 'react';
import { useCart } from '@/src/contexts/CartContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { db, functions } from '@/src/integrations/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Você precisa estar logado para finalizar a compra');
      navigate('/login?redirect=/checkout');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        items,
        subtotal,
        total: subtotal,
        shippingAddress: {
          ...address,
          email: user.email || '',
        },
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        orderNumber: `DI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      toast.success('Pedido criado com sucesso! Siga as instruções de pagamento.');
      
      clearCart();
      navigate(`/checkout/success?orderId=${docRef.id}`);

    } catch (error) {
      toast.error('Erro ao processar checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black tracking-tighter uppercase mb-12">Checkout</h1>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <section className="space-y-6">
            <h2 className="text-xl font-bold">Endereço de Entrega</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" required value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input id="zipCode" required value={address.zipCode} onChange={e => setAddress({...address, zipCode: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" required value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" required value={address.number} onChange={e => setAddress({...address, number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" value={address.complement} onChange={e => setAddress({...address, complement: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" required value={address.neighborhood} onChange={e => setAddress({...address, neighborhood: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" required value={address.state} onChange={e => setAddress({...address, state: e.target.value})} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-surface-elevated/50 p-8 rounded-[2rem] space-y-6">
            <h2 className="text-xl font-bold">Resumo</h2>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-lg font-black pt-2">
                <span>Total</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 bg-ocean rounded-2xl font-bold text-lg">
              {loading ? 'Processando...' : 'Finalizar Pedido'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Ao clicar em finalizar, você verá a chave PIX e as instruções para conclusão do seu pagamento.
            </p>
          </section>
        </div>
      </form>
    </div>
  );
}
