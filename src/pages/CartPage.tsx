import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/src/contexts/CartContext';
import { useFreeShippingThreshold } from '@/src/hooks/useFreeShippingThreshold';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const freeShippingThreshold = useFreeShippingThreshold();
  const navigate = useNavigate();

  const freeShippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
        <div className="h-24 w-24 rounded-full bg-surface-elevated flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Seu carrinho está vazio</h2>
          <p className="text-muted-foreground max-w-sm">
            Navegue pelas nossas categorias e encontre as melhores peças para o seu guarda-roupa.
          </p>
        </div>
        <Link to="/">
          <Button size="lg" className="rounded-xl h-14 px-10 font-bold bg-ocean">Ir para a Loja</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black tracking-tighter uppercase mb-12">Seu Carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-ocean/5 rounded-2xl p-6 space-y-3">
             <div className="flex items-center justify-between text-sm">
               <span className="font-medium flex items-center gap-2">
                 <Truck className="h-4 w-4" /> 
                 {remainingForFreeShipping > 0 
                  ? `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingForFreeShipping)} para FRETE GRÁTIS`
                  : 'Parabéns! Você ganhou FRETE GRÁTIS'}
               </span>
               <span className="font-bold text-ocean">{Math.round(freeShippingProgress)}%</span>
             </div>
             <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-ocean" 
                 initial={{ width: 0 }}
                 animate={{ width: `${freeShippingProgress}%` }}
                 transition={{ duration: 1 }}
               />
             </div>
          </div>

          <div className="space-y-6">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 p-4 rounded-2xl border bg-card hover:bg-surface-elevated/30 transition-colors">
                <div className="h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-surface-elevated">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link to={`/produto/${item.productId}`} className="font-bold hover:text-ocean line-clamp-1">{item.name}</Link>
                      {item.attributes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.attributes).map(([key, val]) => `${key}: ${val}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-muted-foreground hover:text-sunset transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center border rounded-lg overflow-hidden h-8">
                      <button 
                        className="px-3 hover:bg-surface-elevated text-xs font-bold"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button 
                        className="px-3 hover:bg-surface-elevated text-xs font-bold"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <span className="font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-elevated/50 rounded-[2rem] p-8 space-y-6 sticky top-28">
            <h3 className="text-xl font-bold border-b pb-4">Resumo do Pedido</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium text-ocean">{remainingForFreeShipping === 0 ? 'Grátis' : 'Calculado no checkout'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-black">
                <span>Total</span>
                <span className="text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
              </div>
            </div>

            <Button 
               size="lg" 
               className="w-full h-14 rounded-2xl font-bold text-lg bg-ocean hover:bg-ocean/90 gap-2 group"
               onClick={() => navigate('/checkout')}
            >
              Finalizar Compra <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
               variant="outline" 
               className="w-full h-12 rounded-2xl font-semibold border-2"
               onClick={() => navigate('/')}
            >
              Continuar Comprando
            </Button>

            <div className="flex items-center justify-center gap-4 pt-4 grayscale opacity-50">
               <img src="https://logodownload.org/wp-content/uploads/2014/07/visa-logo-1.png" className="h-4 object-contain" alt="Visa" />
               <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-7.png" className="h-6 object-contain" alt="Mastercard" />
               <img src="https://logodownload.org/wp-content/uploads/2015/03/pix-logo-1.png" className="h-4 object-contain" alt="Pix" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
