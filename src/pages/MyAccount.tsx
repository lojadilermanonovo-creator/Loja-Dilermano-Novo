import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/src/integrations/firebase/client';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { User, LogOut, Package, MapPin, Heart, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyAccount() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const d = await getDoc(doc(db, 'users', user.uid));
        if (d.exists()) setProfile(d.data());
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Minha Conta</h2>
          <Link to="/conta">
            <Button variant="default" className="w-full justify-start gap-3 bg-ocean rounded-xl h-12 shadow-lg shadow-ocean/20">
              <User className="h-5 w-5" /> Perfil
            </Button>
          </Link>
          <Link to="/meus-pedidos">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl h-12 hover:bg-ocean/10">
              <Package className="h-5 w-5" /> Meus Pedidos
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl h-12 text-sunset hover:bg-sunset/10" onClick={handleLogout}>
            <LogOut className="h-5 w-5" /> Sair
          </Button>
        </aside>

        <main className="flex-1 space-y-8">
          <div className="bg-surface-elevated/40 p-8 rounded-[2.5rem] border space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-ocean flex items-center justify-center text-white text-3xl font-black">
                {user?.displayName?.[0] || 'U'}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{user?.displayName || 'Usuário'}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
               <div className="space-y-4">
                 <h4 className="font-bold flex items-center gap-2"> <Settings className="h-4 w-4" /> Dados Pessoais</h4>
                 <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Nome Completo</p>
                    <p className="font-medium">{profile?.fullName || 'Não informado'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">CPF</p>
                    <p className="font-medium">{profile?.cpf || 'Não informado'}</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <h4 className="font-bold flex items-center gap-2"> <MapPin className="h-4 w-4" /> Endereços</h4>
                 <p className="text-sm text-muted-foreground">Você ainda não salvou endereços.</p>
                 <Button variant="outline" size="sm" className="rounded-xl">Adicionar Endereço</Button>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
