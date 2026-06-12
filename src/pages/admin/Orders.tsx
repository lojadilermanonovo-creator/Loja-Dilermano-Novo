import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Eye, CheckCircle2, Clock, Truck, XCircle, Search, 
  MapPin, User, DollarSign, Calendar, ClipboardCheck, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected single order state for detailed visual overlay
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
      toast.success('Status do pedido atualizado com sucesso');
      fetchOrders();
      // Keep selected order detail in sync if drawer is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error('Erro ao atualizar status do pedido');
    }
  };

  const updatePaymentStatus = async (orderId: string, isPaid: boolean) => {
    const payState = isPaid ? 'paid' : 'pending';
    try {
      await updateDoc(doc(db, 'orders', orderId), { paymentStatus: payState });
      toast.success('Status do pagamento atualizado com sucesso');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, paymentStatus: payState }));
      }
    } catch (error) {
      toast.error('Erro ao registrar transação financeira');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return <Badge variant="secondary" className="gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'processing': 
        return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 gap-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Processando</Badge>;
      case 'shipped': 
        return <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 gap-1 rounded-full"><Truck className="h-3 w-3" /> Enviado</Badge>;
      case 'delivered': 
        return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 gap-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Entregue</Badge>;
      case 'cancelled': 
        return <Badge variant="destructive" className="gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-250"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
      default: 
        return <Badge variant="outline" className="rounded-full">{status}</Badge>;
    }
  };

  // Open inspection drawer
  const handleInspectOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const codeMatch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const clientMatch = order.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = order.shippingAddress?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const searchMatch = codeMatch || clientMatch || emailMatch;
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    
    return searchMatch && statusMatch;
  });

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Title section with quick analytics totals */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
            Pedidos da Loja
          </h1>
          <p className="text-slate-500 mt-1">
            Gere notas, altere status de entregas e acompanhe as transações do Stripe.
          </p>
        </div>
      </div>

      {/* Search filters toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filtrar por Nº do Pedido, nome do cliente..." 
            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-11 rounded-xl border-slate-200 text-slate-700 bg-white text-xs font-semibold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ver Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Inventory Table layout */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-700 py-4 pl-6">Número</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Data</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Cliente</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Total</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Pagamento</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Status de Entrega</TableHead>
                <TableHead className="font-bold text-slate-700 py-4 text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-400 text-sm">
                    Carregando registros de vendas...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-400 text-sm">
                    Nenhum pedido encontrado utilizando esses parâmetros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const itemsCount = order.items?.reduce((acc: number, cur: any) => acc + (cur.quantity || 1), 0) || 0;
                  const formattedDate = order.createdAt 
                    ? (order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt?.seconds * 1000)).toLocaleDateString('pt-BR')
                    : 'Recente';

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4 pl-6 font-bold font-mono text-slate-900 text-xs">
                        {order.orderNumber || 'DI-XXXX'}
                      </TableCell>
                      
                      <TableCell className="py-4 text-xs text-slate-500">
                        {formattedDate}
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="text-sm font-bold text-slate-800">
                          {order.shippingAddress?.fullName || 'Cliente não identificado'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={order.userId}>
                          Cód: {order.userId || '-'}
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="font-bold text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                        </span>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={order.paymentStatus === 'paid' ? 'default' : 'outline'} 
                            className={`rounded-full px-2 py-0.5 text-[9px] w-fit font-bold ${
                              order.paymentStatus === 'paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-50' 
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                          
                          {/* Fast action toggle pay */}
                          {order.paymentStatus !== 'paid' && (
                            <button 
                              onClick={() => updatePaymentStatus(order.id, true)} 
                              className="text-[9px] text-blue-600 font-extrabold hover:underline w-fit text-left hover:text-blue-700"
                            >
                              Marcar Pago
                            </button>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <Select 
                          value={order.status} 
                          onValueChange={(val) => updateStatus(order.id, val)}
                        >
                          <SelectTrigger className="w-[135px] h-8 rounded-full border border-slate-200 text-xs bg-slate-50 hover:bg-slate-100 transition-colors focus:ring-0">
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

                      <TableCell className="py-4 text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl hover:bg-blue-50 hover:text-blue-600 h-9 w-9 text-slate-500 cursor-pointer"
                          onClick={() => handleInspectOrder(order)}
                          title="Detalhes do pedido"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* INSPECTION DRAWER OVERLAY DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl rounded-3xl bg-white p-0 overflow-hidden flex flex-col h-[85vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl md:text-2xl font-extrabold text-slate-900 font-mono tracking-tighter uppercase flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  Pedido {selectedOrder?.orderNumber || 'DI-XXXX'}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1 flex items-center gap-2 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Registrado em:{' '}
                  {selectedOrder?.createdAt 
                    ? (selectedOrder.createdAt.toDate ? selectedOrder.createdAt.toDate() : new Date(selectedOrder.createdAt?.seconds * 1000)).toLocaleString('pt-BR') 
                    : '-'
                  }
                </DialogDescription>
              </div>

              {/* Status selectors in Drawer top */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedOrder && (
                  <>
                    <div className="flex flex-col items-end mr-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Transporte</span>
                      <Select 
                        value={selectedOrder.status} 
                        onValueChange={(val) => updateStatus(selectedOrder.id, val)}
                      >
                        <SelectTrigger className="h-8 w-[125px] rounded-full border border-slate-200 text-xs bg-white text-slate-700">
                          <SelectValue>{selectedOrder.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="processing">Processando</SelectItem>
                          <SelectItem value="shipped">Enviado</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pagamento</span>
                      <Select 
                        value={selectedOrder.paymentStatus} 
                        onValueChange={(val) => updatePaymentStatus(selectedOrder.id, val === 'paid')}
                      >
                        <SelectTrigger className="h-8 w-[110px] rounded-full border border-slate-200 text-xs bg-white text-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Modal Multi-Sections Grid */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer and address card */}
              <Card className="rounded-2xl border border-slate-200 shadow-none bg-slate-50/40 p-4">
                <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3">
                  <User className="h-4.5 w-4.5 text-blue-500" />
                  <span>Dados do Comprador</span>
                </div>
                {selectedOrder?.shippingAddress ? (
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-500">Nome Completo:</span>
                      <p className="text-slate-800 font-medium mt-0.5">{selectedOrder.shippingAddress.fullName}</p>
                    </div>
                    {selectedOrder.shippingAddress.email && (
                      <div>
                        <span className="font-bold text-slate-500">E-mail:</span>
                        <p className="text-slate-800 font-mono mt-0.5">{selectedOrder.shippingAddress.email}</p>
                      </div>
                    )}
                    {selectedOrder.shippingAddress.phone && (
                      <div>
                        <span className="font-bold text-slate-500">Telefone:</span>
                        <p className="text-slate-800 font-medium mt-0.5">{selectedOrder.shippingAddress.phone ?? '-'}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-500">ID Usuário Auth:</span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{selectedOrder.userId}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">Sem dados do comprador</div>
                )}
              </Card>

              {/* Shipping Address details */}
              <Card className="rounded-2xl border border-slate-200 shadow-none bg-slate-50/40 p-4">
                <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3">
                  <MapPin className="h-4.5 w-4.5 text-blue-500" />
                  <span>Endereço de Entrega</span>
                </div>
                {selectedOrder?.shippingAddress ? (
                  <div className="space-y-2 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number}
                    </p>
                    {selectedOrder.shippingAddress.complement && (
                      <p className="text-slate-500">
                        <span className="font-semibold text-slate-400">Compl:</span> {selectedOrder.shippingAddress.complement}
                      </p>
                    )}
                    <p className="text-slate-600">
                      {selectedOrder.shippingAddress.neighborhood} - {selectedOrder.shippingAddress.city} / {selectedOrder.shippingAddress.state}
                    </p>
                    <p className="font-mono text-slate-500 text-[11px] font-bold mt-1 bg-slate-200/50 w-fit px-2 py-0.5 rounded">
                      CEP: {selectedOrder.shippingAddress.zipCode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">Sem endereço cadastrado</div>
                )}
              </Card>
            </div>

            {/* Shopping Cart Products Items lists */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Itens Solicitados</span>
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white first-letter:">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-500 text-xs py-2.5">Item</TableHead>
                      <TableHead className="font-bold text-slate-500 text-xs text-center py-2.5">Qtd</TableHead>
                      <TableHead className="font-bold text-slate-500 text-xs py-2.5">Preço Unitário</TableHead>
                      <TableHead className="font-bold text-slate-500 text-xs text-right py-2.5 pr-4">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder?.items ? (
                      selectedOrder.items.map((it: any, itemIdx: number) => (
                        <TableRow key={it.productId || itemIdx} className="hover:bg-transparent">
                          <TableCell className="py-2.5">
                            <span className="font-bold text-slate-800 text-sm block">{it.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {it.productId}</span>
                          </TableCell>
                          
                          <TableCell className="text-center py-2.5 font-bold text-slate-700 text-xs">
                            {it.quantity || 1}x
                          </TableCell>

                          <TableCell className="py-2.5 font-medium text-slate-600 text-xs">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.price)}
                          </TableCell>

                          <TableCell className="text-right py-2.5 font-bold text-slate-900 text-xs pr-4">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((it.price || 0) * (it.quantity || 1))}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-xs text-slate-400">
                          Nenhum produto cadastrado no pedido
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financial Totals layout */}
            <div className="flex justify-end pt-4 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
              <div className="w-full sm:w-[280px] space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal dos Itens:</span>
                  <span className="font-bold text-slate-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder?.subtotal || selectedOrder?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium pb-2 border-b border-slate-150">
                  <span>Frete Extra:</span>
                  <span className="font-bold text-emerald-600">Grátis</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                  <span>Valor Total:</span>
                  <span className="text-blue-600 font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder?.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer drawer actions */}
          <DialogFooter className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
            <Button 
              variant="outline" 
              onClick={() => setIsDetailOpen(false)} 
              className="rounded-xl h-10 w-full sm:w-auto font-semibold px-6 bg-white"
            >
              Fechar Visualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
