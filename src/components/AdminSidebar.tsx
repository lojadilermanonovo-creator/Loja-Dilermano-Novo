import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderTree, ClipboardList, LogOut, Package, 
  Image as ImageIcon, Users, Tag, BarChart3, Settings, 
  Sparkles, ChevronLeft, ChevronRight, User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/src/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const location = useLocation();
  const adminEmail = auth.currentUser?.email || 'lojadilermanonovo@gmail.com';
  const [adminBrandName, setAdminBrandName] = useState('Dilermando');

  useEffect(() => {
    const fetchBrandName = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminBrandName) {
            setAdminBrandName(data.adminBrandName);
          }
        }
      } catch (err) {
        console.error('Error fetching admin brand name:', err);
      }
    };
    fetchBrandName();
  }, []);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('admin_sidebar_collapsed', String(next));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sessão encerrada com segurança!');
      if (onClose) onClose();
    } catch (error) {
      toast.error('Erro ao encerrar sessão');
    }
  };

  const menuGroups = [
    {
      groupName: 'Gestão',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { label: 'Produtos', icon: Package, path: '/admin/produtos' },
        { label: 'Categorias', icon: FolderTree, path: '/admin/categorias' },
        { label: 'Pedidos', icon: ClipboardList, path: '/admin/pedidos' },
        { label: 'Clientes', icon: Users, path: '/admin/clientes' },
      ]
    },
    {
      groupName: 'Marketing',
      items: [
        { label: 'Cupons', icon: Tag, path: '/admin/cupons' },
        { label: 'Banners', icon: ImageIcon, path: '/admin/banners' },
      ]
    },
    {
      groupName: 'Sistema',
      items: [
        { label: 'Relatórios', icon: BarChart3, path: '/admin/relatorios' },
        { label: 'Configurações', icon: Settings, path: '/admin/configuracoes' },
      ]
    }
  ];

  return (
    <div 
      className={`flex flex-col h-full bg-slate-905 border-r border-slate-800 transition-all duration-300 ease-in-out py-6 px-4 overflow-y-auto text-slate-100 bg-[#0f172a] shadow-2xl relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      
      {/* Brand logo header */}
      <div className={`mb-8 flex items-center justify-between transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase text-white flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-505/20 text-white">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              {adminBrandName}
            </h2>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mt-1 ml-0.5">ADMIN PANEL</span>
          </div>
        )}
        {isCollapsed && (
          <span className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-650 rounded-xl text-white block">
            <Sparkles className="h-5 w-5" />
          </span>
        )}
        
        {/* Collapse button on desktop layout (hidden when inside mobile drawer check onClose props) */}
        {!onClose && (
          <button 
            onClick={toggleCollapse}
            className="absolute -right-3 top-5 h-6 w-6 rounded-full border border-slate-700 bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shadow-md shadow-black/35 hover:bg-slate-750 transition-colors"
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Navigation Group items */}
      <div className="flex-grow space-y-6">
        {menuGroups.map((group) => (
          <div key={group.groupName} className="space-y-1.5 min-w-0">
            {/* Group Label */}
            {!isCollapsed ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block px-3 mb-2.5">
                {group.groupName}
              </span>
            ) : (
              <div className="border-t border-slate-800/80 my-3 block mx-1" />
            )}

            {/* Sub Link nodes */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');
                return (
                  <Link key={item.path} to={item.path} onClick={onClose} title={isCollapsed ? item.label : ''}>
                    <Button
                      variant="ghost"
                      className={`w-full h-10 px-3 rounded-lg transition-all font-semibold text-xs justify-start gap-3 cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 hover:bg-blue-650 text-white shadow shadow-blue-500/10' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-450'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer details */}
      <div className="pt-6 border-t border-slate-800 mt-6 space-y-4 shrink-0">
        
        {/* Logged Administrative User info box */}
        {!isCollapsed ? (
          <div className="bg-slate-800/30 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[10px] font-bold text-slate-300 truncate">Administrador</p>
              <p className="text-[9px] text-slate-500 truncate" title={adminEmail}>
                {adminEmail}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-1 rounded-xl bg-slate-800/15 border border-slate-850" title={adminEmail}>
            <User className="h-4 w-4 text-slate-400" />
          </div>
        )}

        {/* Log Out button */}
        <Button 
          variant="ghost" 
          className={`text-rose-450 hover:bg-rose-500/10 hover:text-rose-400 h-10 px-3 text-xs font-semibold rounded-lg w-full flex items-center cursor-pointer ${
            isCollapsed ? 'justify-center' : 'justify-start gap-3'
          }`}
          onClick={handleLogout}
          title={isCollapsed ? 'Sair da Conta' : ''}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span>Sair da Conta</span>}
        </Button>
      </div>

    </div>
  );
}
