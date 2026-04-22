import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    customers: 0,
    products: 0,
    revenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Mock stats for demo
      setStats({
        orders: 124,
        customers: 850,
        products: 42,
        revenue: 15420.50
      });
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Seg', sales: 4000 },
    { name: 'Ter', sales: 3000 },
    { name: 'Qua', sales: 5000 },
    { name: 'Qui', sales: 2780 },
    { name: 'Sex', sales: 1890 },
    { name: 'Sab', sales: 6390 },
    { name: 'Dom', sales: 4490 },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu e-commerce.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-2 shadow-none hover:border-ocean transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-ocean" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.revenue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">+20.1% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-none hover:border-ocean transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-ocean" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.orders}</div>
            <p className="text-xs text-muted-foreground">+180.1% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-none hover:border-ocean transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-ocean" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.customers}</div>
            <p className="text-xs text-muted-foreground">+19% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-none hover:border-ocean transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-ocean" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <p className="text-xs text-muted-foreground">+2 novos adicionados hoje</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-2 shadow-none p-6">
        <CardHeader>
          <CardTitle>Desempenho Semanal</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                 cursor={{fill: 'transparent'}}
                 contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
              />
              <Bar dataKey="sales" fill="hsl(var(--color-ocean))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
