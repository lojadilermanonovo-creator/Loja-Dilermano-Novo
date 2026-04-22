import { useAuth } from '@/src/contexts/AuthContext';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Search, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setLoading(true);
        const q = query(
          collection(db, 'orders'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-8">Meus Pedidos</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <div className="h-20 w-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto text-muted-foreground">
             <Package className="h-10 w-10" />
          </div>
          <p className="text-muted-foreground text-lg">Você ainda não realizou nenhum pedido.</p>
          <Link to="/">
            <Button className="bg-ocean rounded-xl px-8 h-12 font-bold">Começar a Comprar</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-6 border rounded-2xl bg-card hover:bg-surface-elevated/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Pedido {order.orderNumber}</p>
                <p className="text-sm font-medium">{order.createdAt?.toDate().toLocaleDateString('pt-BR')}</p>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline" className="rounded-full bg-ocean/5 text-ocean border-ocean/20">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                  </Badge>
                  <span className="text-lg font-black">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="text-right hidden md:block">
                   <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Status</p>
                   <p className="font-bold flex items-center gap-1">
                     <Clock className="h-3 w-3" /> {order.status}
                   </p>
                 </div>
                 <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 border">
                    <ChevronRight className="h-6 w-6" />
                 </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
