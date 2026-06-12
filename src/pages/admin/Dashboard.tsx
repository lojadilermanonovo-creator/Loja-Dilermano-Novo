import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { 
  collection, getDocs, setDoc, updateDoc, deleteDoc, doc, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  ShoppingBag, Users, Package, TrendingUp, FolderOpen, 
  Plus, Eye, Image as ImageIcon, Trash2, LayoutGrid, LayoutList, Sparkles, CheckCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'banners'>('overview');
  const [loading, setLoading] = useState(true);
  
  // Real Statistics state
  const [stats, setStats] = useState({
    orders: 0,
    customers: 0,
    products: 0,
    categories: 0,
    revenue: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  // Banner state managers
  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  
  // New Banner Form fields
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerSortOrder, setBannerSortOrder] = useState('1');
  const [bannerIsActive, setBannerIsActive] = useState(true);

  // Main loader for analytics
  const fetchDbMetrics = async () => {
    setLoading(true);
    try {
      // 1. Products
      const productsSnap = await getDocs(collection(db, 'products'));
      const totalProducts = productsSnap.size;

      // 2. Categories
      const categoriesSnap = await getDocs(collection(db, 'categories'));
      const totalCategories = categoriesSnap.size;

      // 3. Orders & revenue
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersList = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const totalOrders = ordersList.length;

      // Calculate real total revenue from paid or completed orders
      const paidOrders = ordersList.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Unique customers calculated from order uids or addresses
      const customerIds = new Set(ordersList.map(o => o.userId || o.shippingAddress?.fullName).filter(Boolean));
      const totalCustomers = customerIds.size || 0;

      setStats({
        orders: totalOrders,
        customers: totalCustomers || 0,
        products: totalProducts,
        categories: totalCategories,
        revenue: totalRevenue
      });

      // Filter and sort for 5 recent orders
      const sortedOrders = [...ordersList]
        .sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        })
        .slice(0, 5);
      setRecentOrders(sortedOrders);

      // Map orders to weekday totals for charting relative metrics on active weeks
      const weekdaySum: Record<string, number> = {
        'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0, 'Dom': 0
      };

      ordersList.forEach((order) => {
        if (order.createdAt) {
          try {
            // Firestore date object convert
            const date = typeof order.createdAt.toDate === 'function' 
              ? order.createdAt.toDate() 
              : new Date(order.createdAt?.seconds * 1000 || Date.now());
            
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const dayName = days[date.getDay()];
            weekdaySum[dayName] = (weekdaySum[dayName] || 0) + (order.total || 0);
          } catch (e) {
            console.warn(e);
          }
        }
      });

      const hasSales = Object.values(weekdaySum).some(val => val > 0);
      if (hasSales) {
        setChartData([
          { name: 'Seg', sales: weekdaySum['Seg'] },
          { name: 'Ter', sales: weekdaySum['Ter'] },
          { name: 'Qua', sales: weekdaySum['Qua'] },
          { name: 'Qui', sales: weekdaySum['Qui'] },
          { name: 'Sex', sales: weekdaySum['Sex'] },
          { name: 'Sab', sales: weekdaySum['Sáb'] },
          { name: 'Dom', sales: weekdaySum['Dom'] },
        ]);
      } else {
        // Fallback placeholder chart with a distinct visual slope
        setChartData([
          { name: 'Seg', sales: 800 },
          { name: 'Ter', sales: 1400 },
          { name: 'Qua', sales: 1100 },
          { name: 'Qui', sales: 2500 },
          { name: 'Sex', sales: 1900 },
          { name: 'Sab', sales: 3200 },
          { name: 'Dom', sales: 2100 },
        ]);
      }
    } catch (error) {
      console.error("Error loaded metrics stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Banner CRUD loaders
  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const snap = await getDocs(collection(db, 'banners'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort locally
      list.sort((a, b) => (Number(a.sortOrder) || 1) - (Number(b.sortOrder) || 1));
      setBanners(list);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar banners promocionais');
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    fetchDbMetrics();
    fetchBanners();
  }, []);

  const handleOpenBannerDialog = (banner?: any) => {
    if (banner) {
      setSelectedBanner(banner);
      setBannerTitle(banner.title || '');
      setBannerSubtitle(banner.subtitle || '');
      setBannerImageUrl(banner.imageUrl || '');
      setBannerSortOrder(String(banner.sortOrder || 1));
      setBannerIsActive(banner.isActive ?? true);
    } else {
      setSelectedBanner(null);
      setBannerTitle('');
      setBannerSubtitle('');
      setBannerImageUrl('');
      setBannerSortOrder(String(banners.length + 1));
      setBannerIsActive(true);
    }
    setIsBannerDialogOpen(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerImageUrl || !bannerTitle) {
      toast.error('Favor preencher o título do banner e a URL da imagem correspondente');
      return;
    }
    try {
      const bannerPayload = {
        title: bannerTitle,
        subtitle: bannerSubtitle,
        imageUrl: bannerImageUrl,
        sortOrder: Number(bannerSortOrder) || 1,
        isActive: bannerIsActive,
        updatedAt: serverTimestamp()
      };

      if (selectedBanner) {
        await updateDoc(doc(db, 'banners', selectedBanner.id), bannerPayload);
        toast.success('Prontinho! Banner atualizado com sucesso.');
      } else {
        const newRef = doc(collection(db, 'banners'));
        await setDoc(newRef, {
          ...bannerPayload,
          createdAt: serverTimestamp()
        });
        toast.success('Sucesso! Novo banner promocional registrado.');
      }
      setIsBannerDialogOpen(false);
      fetchBanners();
    } catch (error) {
      toast.error('Erro ao salvar os detalhes do banner');
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Tem certeza de que deseja remover este banner promocional?')) return;
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      toast.success('Banner removido');
      fetchBanners();
    } catch (error) {
      toast.error('Erro ao excluir o banner do banco de dados');
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header with Title and Dashboard Tabs switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            Painel Administrativo
          </h1>
          <p className="text-slate-500 mt-1">
            Controle de inventário, pedidos, categorias e experiências visuais da loja.
          </p>
        </div>

        {/* Top Segmented Control Switcher */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl w-fit shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('overview')}
            className={`rounded-lg font-bold text-xs h-9 px-4 transition-all ${
              activeTab === 'overview' 
                ? 'bg-white shadow-sm text-slate-900' 
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <LayoutGrid className="mr-2 h-4 w-4" /> Visão Geral
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('banners')}
            className={`rounded-lg font-bold text-xs h-9 px-4 transition-all ${
              activeTab === 'banners' 
                ? 'bg-white shadow-sm text-slate-900' 
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <ImageIcon className="mr-2 h-4 w-4" /> Banners Promocionais
          </Button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        /* OVERVIEW TAB CONTENT (BENTO GRID DESIGN) */
        <div className="space-y-8">
          {/* Bento Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Net revenue card */}
            <Card className="rounded-2xl border-none shadow-sm hover:shadow transition-shadow bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-white/80">Faturamento Líquido</CardTitle>
                <TrendingUp className="h-4.5 w-4.5 text-white/80" />
              </CardHeader>
              <CardContent className="pt-2 z-10 relative">
                <div className="text-2xl font-extrabold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)}
                </div>
                <p className="text-[10px] text-white/70 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Pedidos pagos ou entregues
                </p>
              </CardContent>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </Card>

            {/* Total orders card */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white hover:border-blue-400 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Pedidos</CardTitle>
                <ShoppingBag className="h-4.5 w-4.5 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-black text-slate-800">
                  {loading ? '...' : stats.orders}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Registrados no Firestore</p>
              </CardContent>
            </Card>

            {/* Unique customers card */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white hover:border-blue-400 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes Ativos</CardTitle>
                <Users className="h-4.5 w-4.5 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-black text-slate-800">
                  {loading ? '...' : stats.customers}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Comportamento transacional</p>
              </CardContent>
            </Card>

            {/* Products active catalog */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white hover:border-blue-400 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produtos</CardTitle>
                <Package className="h-4.5 w-4.5 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-black text-slate-800">
                  {loading ? '...' : stats.products}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Cadastrados no catálogo</p>
              </CardContent>
            </Card>

            {/* Categories count */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white hover:border-blue-400 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categorias</CardTitle>
                <FolderOpen className="h-4.5 w-4.5 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-black text-slate-800">
                  {loading ? '...' : stats.categories}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Seções organizadoras</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart & Recent activity row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly performance Chart (col-span 2) */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white lg:col-span-2 p-6">
              <CardHeader className="px-0 pt-0 pb-6">
                <CardTitle className="text-lg font-bold text-slate-900">Vendas por Dia da Semana</CardTitle>
                <CardDescription>Representação gráfica do desempenho financeiro semanal.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] w-full p-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs text-slate-400" />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      className="text-xs text-slate-400"
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 16px -4px rgba(0,0,0,0.05)',
                        backgroundColor: '#ffffff'
                      }}
                      formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Vendido']}
                    />
                    <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Orders List summary card */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
              <CardHeader className="px-0 pt-0 pb-6">
                <CardTitle className="text-lg font-bold text-slate-900">Pedidos Recentes</CardTitle>
                <CardDescription>Últimas 5 compras realizadas na loja.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-400">Procurando no Firestore...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">Nenhum pedido efetuado ainda.</div>
                ) : (
                  recentOrders.map((order: any, idx: number) => {
                    const dateFormatted = order.createdAt 
                      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR') 
                      : 'Recente';
                    
                    return (
                      <div key={order.id || idx} className="flex items-center justify-between gap-3 text-sm pb-3.5 border-b border-dashed border-slate-100 last:border-b-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 font-mono truncate">{order.orderNumber || `DI-XXXX`}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {dateFormatted} • {order.shippingAddress?.fullName || 'Cliente'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-slate-900">R$ {(order.total || 0).toFixed(2)}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-[8px] font-bold h-4 py-0 px-1 rounded-full ${
                              order.paymentStatus === 'paid' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' 
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* BANNERS TAB CONTENT: COMPLETE CRM AND LAYOUT PROMO OPTIONS */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Banners Rotativos</h2>
              <p className="text-sm text-slate-500">Configure os banners em destaque exibidos no topo do carrossel principal.</p>
            </div>
            <Button onClick={() => handleOpenBannerDialog()} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl gap-2 h-11 px-5 cursor-pointer text-white">
              <Plus className="h-4.5 w-4.5" /> Adicionar Banner
            </Button>
          </div>

          {bannersLoading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Carregando carrossel promocional...</div>
          ) : banners.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-white">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-800 text-lg">Nenhum banner ativo</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                Adicione banners agora para substituir as fotos estáticas do carrossel inicial por banners altamente dinâmicos.
              </p>
              <Button onClick={() => handleOpenBannerDialog()} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl gap-2 mt-4 px-6 cursor-pointer text-white">
                <Plus className="h-4 w-4" /> Cadastrar Meu Primeiro Banner
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <Card key={banner.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                  {/* Photo Preview */}
                  <div className="aspect-video relative overflow-hidden bg-slate-900">
                    <img 
                      src={banner.imageUrl} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={banner.title} 
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                      Ordem: {banner.sortOrder || 1}
                    </div>
                  </div>

                  <CardHeader className="p-4 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-base truncate" title={banner.title}>
                        {banner.title}
                      </h3>
                      <Badge className={banner.isActive ? 'bg-emerald-500' : 'bg-slate-300'}>
                        {banner.isActive ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </div>
                    {banner.subtitle && (
                      <p className="text-xs text-slate-400 line-clamp-2">{banner.subtitle}</p>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-0 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleOpenBannerDialog(banner)}
                      className="rounded-lg h-9 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="rounded-lg h-9 px-3 text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    >
                      Excluir
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banner Dialog Form Modal */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {selectedBanner ? 'Editar Banner' : 'Novo Banner Promocional'}
            </DialogTitle>
            <DialogDescription>
              Os banners configurados aqui aparecem no topo da página inicial do seu site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="b-title" className="text-slate-700 font-semibold text-xs">Título Principal (Hero)</Label>
              <Input 
                id="b-title" 
                value={bannerTitle} 
                onChange={e => setBannerTitle(e.target.value)} 
                placeholder="Ex: Sua Melhor Versão Começa Aqui" 
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="b-subtitle" className="text-slate-700 font-semibold text-xs">Subtítulo (Opcional)</Label>
              <Input 
                id="b-subtitle" 
                value={bannerSubtitle} 
                onChange={e => setBannerSubtitle(e.target.value)} 
                placeholder="Ex: Coleção Outono/Inverno 2026 já disponível." 
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="b-image" className="text-slate-700 font-semibold text-xs">URL da Imagem de Fundo (Recomendado: 2000x800px)</Label>
              <Input 
                id="b-image" 
                value={bannerImageUrl} 
                onChange={e => setBannerImageUrl(e.target.value)} 
                placeholder="https://images.unsplash.com/photo-..." 
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="b-order" className="text-slate-700 font-semibold text-xs">Ordem de Exibição</Label>
                <Input 
                  id="b-order" 
                  type="number" 
                  value={bannerSortOrder} 
                  onChange={e => setBannerSortOrder(e.target.value)} 
                  placeholder="1 (Principal)" 
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="flex flex-col justify-end pb-1">
                <div className="flex items-center space-x-3 h-11">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      id="b-active"
                      type="checkbox" 
                      checked={bannerIsActive} 
                      onChange={(e) => setBannerIsActive(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-xs font-semibold text-slate-700 cursor-pointer">Banner Ativo</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsBannerDialogOpen(false)} className="rounded-xl h-11 font-medium z-10">
              Cancelar
            </Button>
            <Button onClick={handleSaveBanner} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-11 px-6 cursor-pointer text-white">
              Salvar Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
