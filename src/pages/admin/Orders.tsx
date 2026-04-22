import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Erro ao buscar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success('Status atualizado');
      fetchOrders();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1 rounded-full"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'processing': return <Badge className="bg-blue-500 hover:bg-blue-600 gap-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Processando</Badge>;
      case 'shipped': return <Badge className="bg-ocean gap-1 rounded-full"><Truck className="h-3 w-3" /> Enviado</Badge>;
      case 'delivered': return <Badge className="bg-emerald-500 gap-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Entregue</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="gap-1 rounded-full"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
      default: return <Badge variant="outline" className="rounded-full">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie as vendas da loja.</p>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10">Carregando...</TableCell></TableRow>
            ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
            ) : orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-bold font-mono">{order.orderNumber || 'DI-XXXX'}</TableCell>
                <TableCell className="text-xs">
                  {order.createdAt?.toDate().toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{order.shippingAddress?.fullName || 'Cliente'}</div>
                  <div className="text-[10px] text-muted-foreground">{order.userId}</div>
                </TableCell>
                <TableCell className="font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                </TableCell>
                <TableCell>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'} shadow-sm={order.paymentStatus === 'paid'} className={order.paymentStatus === 'paid' ? 'bg-emerald-500' : ''}>
                    {order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    defaultValue={order.status} 
                    onValueChange={(val) => updateStatus(order.id, val)}
                  >
                    <SelectTrigger className="w-[140px] h-8 rounded-full border-2">
                       <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
