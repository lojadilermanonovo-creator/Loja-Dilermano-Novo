import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/integrations/firebase/client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Clock, MapPin, User, Package, Truck, 
  ExternalLink, Calendar, CheckCircle2, DollarSign, XCircle, AlertCircle, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const STATUS_STEPS = [
  { code: 'pending', label: 'Pedido Recebido', desc: 'Seu pedido foi registrado em nossa loja.' },
  { code: 'paid', label: 'Pagamento Aprovado', desc: 'O pagamento por PIX ou cartão de crédito foi confirmado.' },
  { code: 'processing', label: 'Separando Pedido', desc: 'Sua remessa está sendo separada e embalada com carinho.' },
  { code: 'shipped', label: 'Pedido Enviado', desc: 'O pacote foi postado e já se encontra a caminho de sua casa.' },
  { code: 'delivered', label: 'Pedido Entregue', desc: 'O produto foi entregue no seu endereço de destino.' }
];

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        }
      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md space-y-6">
        <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Pedido não encontrado</h2>
        <p className="text-muted-foreground text-sm">O link utilizado pode estar quebrado ou pertencer a outro usuário.</p>
        <Link to="/meus-pedidos">
          <Button className="bg-ocean rounded-xl w-full h-12 font-bold mt-4 flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar para Pedidos
          </Button>
        </Link>
      </div>
    );
  }

  // Fallback state calculations & dates
  const orderDate = order.createdAt 
    ? (order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt?.seconds * 1000))
    : new Date();

  // Generate complete sequence timeline
  const generateTimeline = (ord: any) => {
    // If order already has trackingEvents populated, use them
    if (ord.trackingEvents && Array.isArray(ord.trackingEvents) && ord.trackingEvents.length > 0) {
      return ord.trackingEvents.map((ev: any) => {
        let dateObj = null;
        if (ev.createdAt) {
          if (ev.createdAt.toDate) {
            dateObj = ev.createdAt.toDate();
          } else if (ev.createdAt.seconds) {
            dateObj = new Date(ev.createdAt.seconds * 1000);
          } else {
            dateObj = new Date(ev.createdAt);
          }
        }
        return {
          code: ev.code,
          label: ev.label,
          description: ev.description,
          date: dateObj,
          done: true,
          active: ev.code === ord.status
        };
      });
    }

    // Default timeline generation based off standard status (retrocompatible helper!)
    const currentStatus = ord.status || 'pending';
    if (currentStatus === 'cancelled') {
      return [
        {
          code: 'pending',
          label: 'Pedido Recebido',
          description: 'Seu pedido foi registrado em nossa loja.',
          date: orderDate,
          done: true,
          active: false,
        },
        {
          code: 'cancelled',
          label: 'Pedido Cancelado',
          description: 'Seu pedido foi cancelado e não prosseguirá na entrega.',
          date: orderDate,
          done: true,
          active: true,
          isRed: true,
        }
      ];
    }

    const statusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);

    return STATUS_STEPS.map((step, idx) => {
      const isDone = idx <= currentIndex;
      const isActive = idx === currentIndex;
      
      let stepDate = null;
      if (isDone) {
        stepDate = new Date(orderDate.getTime() + idx * 45 * 60 * 1000); // 45 min interval illusion
      }

      return {
        code: step.code,
        label: step.label,
        description: step.desc,
        date: stepDate,
        done: isDone,
        active: isActive
      };
    });
  };

  const timelineEvents = generateTimeline(order);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pagamento Aprovado';
      case 'processing': return 'Separando Pedido';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status || 'Pendente';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8 max-w-5xl space-y-8"
    >
      {/* Return Headings row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-slate-200">
        <div className="space-y-1.5 animate-in">
          <Link to="/meus-pedidos" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-slate-900 font-bold uppercase tracking-wider mb-2 transition-colors">
            <ArrowLeft className="h-4.5 w-4.5" /> Voltar aos Pedidos
          </Link>
          <h1 className="text-2xl md:text-3xl font-black font-mono uppercase tracking-tighter text-slate-900 flex items-center gap-2">
            Pedido {order.orderNumber}
          </h1>
          <p className="text-slate-500 text-xs flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            Realizado em: {orderDate.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 uppercase font-black tracking-wider px-3.5 py-1.5 rounded-full text-[10px]">
             {getStatusLabel(order.status)}
          </Badge>
          <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'} className={`rounded-full px-3 py-1.5 text-[10px] uppercase font-black tracking-wider ${
            order.paymentStatus === 'paid' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' 
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}>
            {order.paymentStatus === 'paid' ? 'Pago' : 'Confirmação Pendente'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main content columns spanning 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tracking Timeline Column */}
          <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Linha do Tempo de Entrega
              </h2>
            </div>
            
            <CardContent className="p-6 md:p-8">
              {/* Timeline layout vertical */}
              <div className="relative border-l border-slate-200 pl-6 ml-4 space-y-8 pb-2">
                {timelineEvents.map((ev, index) => {
                  let badgeColors = "bg-slate-100 border-slate-200 text-slate-400";
                  if (ev.done) {
                    badgeColors = "bg-emerald-50 border-emerald-200 text-emerald-600";
                  }
                  if (ev.active) {
                    badgeColors = "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 ring-4 ring-blue-50";
                  }
                  if (ev.isRed) {
                    badgeColors = "bg-rose-50 border-rose-200 text-rose-600";
                  }

                  const formattedEventTime = ev.date 
                    ? ev.date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) 
                    : 'Aguardando etapa';

                  return (
                    <div key={index} className="relative group">
                      {/* Timeline status bubble node */}
                      <span className={`absolute -left-[35px] top-0.5 flex items-center justify-center h-6 w-6 rounded-full border text-xs font-bold transition-all ${badgeColors}`}>
                        {ev.code === 'cancelled' ? (
                          <XCircle className="h-4.5 w-4.5" />
                        ) : ev.done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4.5 w-4.5" />
                        )}
                      </span>

                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h3 className={`text-sm font-black uppercase tracking-tight ${ev.active ? 'text-blue-600' : 'text-slate-800'}`}>
                            {ev.label}
                          </h3>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold bg-slate-50 w-fit px-1.5 py-0.5 rounded">
                            {formattedEventTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-550 leading-relaxed font-medium">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Table List of items inside order */}
          <Card className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Lista de Itens do Pedido
              </h2>
            </div>
            
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {order.items?.map((item: any, idx: number) => (
                  <div key={item.productId || idx} className="p-6 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-800">{item.name}</h3>
                      {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(item.attributes).map(([key, value]: any) => (
                            <span key={key} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-550 px-2 py-0.5 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 font-mono">Cód: {item.productId}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-500 block">{item.quantity}x</span>
                      <span className="text-sm font-black text-slate-950 font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total calculations block */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <p className="text-xs text-slate-500 font-medium">Frete e coleta inclusos sob responsabilidade da loja.</p>
                
                <div className="w-full sm:w-[260px] text-xs space-y-2">
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Itens ({order.items?.length || 0}):</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.subtotal || order.total || 0)}</span>
                  </div>
                  
                  {order.discountAmount && order.discountAmount > 0 ? (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Desconto ({order.couponCode}):
                      </span>
                      <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.discountAmount)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between text-slate-500 font-semibold pb-1.5 border-b border-slate-200">
                    <span>Envio:</span>
                    <span className={order.shippingCost && order.shippingCost > 0 ? "font-bold text-slate-700" : "text-emerald-600 font-extrabold uppercase"}>
                      {order.shippingCost && order.shippingCost > 0 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.shippingCost)
                        : "Grátis"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-base pt-1">
                    <span>Total Pago:</span>
                    <span className="text-blue-600 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right sidebar spanning 1/3 */}
        <div className="space-y-8">
          
          {/* Tracking Carrier Card if exists */}
          {order.trackingCode && (
            <Card className="rounded-3xl border border-blue-150 overflow-hidden bg-blue-50/30 ring-1 ring-blue-100">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 font-black text-blue-900 border-b border-blue-100/55 pb-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span className="uppercase text-sm tracking-tight">Rastreamento Rápido</span>
                </div>
                
                <div className="space-y-3.5 text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-450 uppercase text-[9px] tracking-wider block">Transportadora</span>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{order.carrierName || 'Correios'}</p>
                  </div>
                  
                  <div>
                    <span className="font-bold text-slate-450 uppercase text-[9px] tracking-wider block">Código Objeto</span>
                    <p className="text-slate-900 font-mono font-black text-sm mt-0.5 uppercase select-all tracking-wider selection:bg-blue-200">{order.trackingCode}</p>
                  </div>
                </div>

                <a 
                  href={`https://www.linkcorreios.com.br/?id=${order.trackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="block pt-2"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 leading-none h-11 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-100 transition-all">
                    Rastrear Pedido <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Client Personal Info Address */}
          <Card className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 font-black text-slate-800 border-b border-slate-100 pb-3">
              <User className="h-4.5 w-4.5 text-blue-500" />
              <span className="uppercase text-xs tracking-wider">Dados de Envio</span>
            </div>
            
            {order.shippingAddress ? (
              <div className="space-y-4 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-400 block mb-0.5">Destinatário</span>
                  <p className="text-slate-800 font-bold">{order.shippingAddress.fullName}</p>
                  {order.shippingAddress.email && <p className="text-slate-500 font-mono mt-0.5">{order.shippingAddress.email}</p>}
                </div>

                <div>
                  <span className="font-bold text-slate-400 block mb-0.5">Endereço Completo</span>
                  <p className="text-slate-800 font-bold">
                    {order.shippingAddress.street}, {order.shippingAddress.number}
                  </p>
                  {order.shippingAddress.complement && (
                    <p className="text-slate-500 text-xs font-semibold mt-0.5">
                      Compl: {order.shippingAddress.complement}
                    </p>
                  )}
                  <p className="text-slate-600 mt-1">
                    {order.shippingAddress.neighborhood} - {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                  <p className="font-mono text-slate-500 text-[10px] uppercase font-black tracking-wide mt-2 bg-slate-100 w-fit px-2 py-1 rounded">
                    CEP: {order.shippingAddress.zipCode}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-center py-4 text-xs">Dados de endereço não preenchidos.</div>
            )}
          </Card>

        </div>

      </div>
    </motion.div>
  );
}
