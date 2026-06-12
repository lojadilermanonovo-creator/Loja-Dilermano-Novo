import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderTree, ClipboardList, LogOut, Package, Image as ImageIcon, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/src/integrations/firebase/client';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const location = useLocation();
  const adminEmail = auth.currentUser?.email || 'lojadilermanonovo@gmail.com';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logout realizado com sucesso');
      if (onClose) onClose();
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
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64 p-6 overflow-y-auto text-slate-100 dark">
      {/* Brand Header */}
      <div className="mb-8 px-2 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase text-white flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            Dilermando
          </h2>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mt-1 ml-0.5">ADMIN PORTAL</span>
        </div>
      </div>

      {/* Nav Link Items */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onClose}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3.5 h-11 px-4 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-blue-600 hover:bg-blue-600 text-white shadow-md shadow-blue-500/10 font-semibold' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Sign Out Footer */}
      <div className="pt-6 border-t border-slate-800 mt-auto space-y-4">
        {/* Administrator Profile Card */}
        <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-705 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate capitalize">Administrador</p>
            <p className="text-[10px] text-slate-500 truncate" title={adminEmail}>
              {adminEmail}
            </p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3.5 h-11 px-4 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4.5 w-4.5" />
          <span className="font-semibold">Sair da Conta</span>
        </Button>
      </div>
    </div>
  );
}
