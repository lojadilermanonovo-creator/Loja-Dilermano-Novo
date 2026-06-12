import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, ShoppingBag, TrendingUp, Award, Clock, ArrowDownToLine, Users, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReports() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States computed
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number; revenue: number }[]>([]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setOrders(list);

      // Compute statistics
      const allOrders = list;
      const validOrders = list.filter(ord => ord.status !== 'cancelled');

      const count = allOrders.length;
      const revenue = validOrders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
      const ticket = count > 0 ? (revenue / count) : 0;

      // Top Selling Products Map
      const productMap: { [key: string]: { quantity: number; revenue: number } } = {};
      validOrders.forEach(ord => {
        if (ord.items && Array.isArray(ord.items)) {
          ord.items.forEach((item: any) => {
            const name = item.name || 'Produto Não Identificado';
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const totalItemPrice = price * qty;

            if (productMap[name]) {
              productMap[name].quantity += qty;
              productMap[name].revenue += totalItemPrice;
            } else {
              productMap[name] = { quantity: qty, revenue: totalItemPrice };
            }
          });
        }
      });

      // Sort & Slice
      const sortedProducts = Object.entries(productMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setTotalOrders(count);
      setTotalRevenue(revenue);
      setAverageTicket(ticket);
      setTopProducts(sortedProducts);

    } catch (e) {
      console.error(e);
      toast.error('Erro ao processar dados de relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
            Relatórios Clínicos de Vendas
          </h1>
          <p className="text-slate-500 mt-1">
            Métricas de desempenho calculadas em tempo real a partir dos pedidos no Firestore.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchReportsData}
          className="rounded-xl border-slate-200 hover:bg-slate-50 h-10 px-6 font-bold shrink-0 cursor-pointer text-slate-700"
        >
          Atualizar Dados
        </Button>
      </div>

      {/* Main KPI metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Total Pedidos Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block">Total de Pedidos</span>
            <span className="text-3xl font-black text-slate-900">{loading ? '...' : totalOrders}</span>
            <span className="text-[10px] text-slate-400 block font-semibold">Incluindo pendentes e pagos</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        {/* Receita Total Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block">Faturamento Bruto</span>
            <span className="text-3xl font-black text-emerald-600 font-mono">{loading ? '...' : formatBRL(totalRevenue)}</span>
            <span className="text-[10px] text-emerald-600 block bg-emerald-50 w-fit px-2 py-0.5 rounded-full font-bold">Apenas pedidos válidos</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Ticket Médio Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block">Ticket Médio</span>
            <span className="text-3xl font-black text-slate-900 font-mono">{loading ? '...' : formatBRL(averageTicket)}</span>
            <span className="text-[10px] text-slate-400 block font-semibold">Faturamento dividido por total de pedidos</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Grid reports layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Products Rank - Left (span 7) */}
        <div className="lg:col-span-7 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Top 5 Modelos Mais Vendidos
            </h2>
            <p className="text-xs text-slate-400 mt-1">Produtos com maior volume de unidades despachadas e receita gerada.</p>
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm">Carregando estatísticas...</div>
            ) : topProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm">Nenhuma venda registrada até o momento para listagem.</div>
            ) : (
              topProducts.map((p, idx) => {
                const maxQuantity = topProducts[0]?.quantity || 1;
                const ratio = Math.max(10, (p.quantity / maxQuantity) * 100);
                
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[280px]">
                        {idx + 1}. {p.name}
                      </span>
                      <span className="font-bold text-slate-500 text-[11px]">{p.quantity} un. ({formatBRL(p.revenue)})</span>
                    </div>
                    {/* Visual Progress Bar indicator */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${ratio}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Orders status distribution graph - Right (span 5) */}
        <div className="lg:col-span-5 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-505" />
              Distribuição por Status
            </h2>
            <p className="text-xs text-slate-400 mt-1">Status operacional de processamento de compras recebidas.</p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs">Aguardando dados...</div>
            ) : (
              ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
                const listStatus = orders.filter(o => o.status === status);
                const count = listStatus.length;
                const totalCountLabel = orders.length || 1;
                const percent = ((count / totalCountLabel) * 100).toFixed(0);

                const labelMap: { [key: string]: { val: string; style: string } } = {
                  pending: { val: 'Pendente', style: 'bg-amber-400' },
                  processing: { val: 'Processando', style: 'bg-blue-500' },
                  shipped: { val: 'Enviado', style: 'bg-indigo-500' },
                  delivered: { val: 'Entregue', style: 'bg-emerald-500' },
                  cancelled: { val: 'Cancelado', style: 'bg-slate-400' },
                };

                const mapped = labelMap[status] || { val: status, style: 'bg-slate-400' };

                return (
                  <div key={status} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${mapped.style}`} />
                      <span className="text-xs font-bold text-slate-755">{mapped.val}</span>
                    </div>
                    <div className="text-xs font-black text-slate-800">
                      {count} <span className="text-[10px] text-slate-400 font-medium">({percent}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
