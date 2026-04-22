import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, ClipboardList, Settings, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/src/integrations/firebase/client';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

export default function AdminSidebar() {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao sair');
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Produtos', icon: Package, path: '/admin/produtos' },
    { label: 'Categorias', icon: FolderTree, path: '/admin/categorias' },
    { label: 'Pedidos', icon: ClipboardList, path: '/admin/pedidos' },
  ];

  return (
    <div className="flex flex-col h-full bg-surface-elevated/50 border-r w-64 p-6 overflow-y-auto">
      <div className="mb-10 px-2">
        <h2 className="text-xl font-black tracking-tighter uppercase text-ocean">Admin Panel</h2>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-12 rounded-xl transition-all ${
                  isActive ? 'bg-ocean shadow-lg shadow-ocean/20' : 'hover:bg-ocean/10 hover:text-ocean'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-bold">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 h-12 rounded-xl text-sunset hover:bg-sunset/10 hover:text-sunset"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-bold">Sair</span>
        </Button>
      </div>
    </div>
  );
}
