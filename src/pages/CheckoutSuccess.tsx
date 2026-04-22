import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center max-w-2xl">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="h-24 w-24 rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white mb-8"
      >
        <CheckCircle className="h-12 w-12" />
      </motion.div>

      <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">Pedido Realizado!</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Obrigado por comprar na Dilermano. Seu pedido foi recebido e estamos processando o pagamento.
      </p>

      {orderId && (
        <div className="p-4 bg-surface-elevated rounded-2xl border mb-8 font-mono text-sm">
          ID do Pedido: <span className="font-bold">{orderId}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link to="/meus-pedidos" className="flex-1 max-w-xs">
          <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 gap-2">
            Ver Meus Pedidos <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/" className="flex-1 max-w-xs">
          <Button className="w-full h-14 rounded-2xl font-bold bg-ocean gap-2">
            <ShoppingBag className="h-4 w-4" /> Continuar Comprando
          </Button>
        </Link>
      </div>

      <p className="mt-12 text-sm text-muted-foreground italic">
        Você receberá um e-mail com os detalhes do seu pedido em breve.
      </p>
    </div>
  );
}
