import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/src/integrations/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) {
      toast.error('Código de redefinição inválido.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode) {
    return (
       <div className="container mx-auto px-4 py-20 text-center">
         <h1 className="text-2xl font-bold">Link Inválido</h1>
         <p className="text-muted-foreground mt-2">Este link de redefinição não é válido ou expirou.</p>
         <Button variant="link" onClick={() => navigate('/login')} className="mt-4">Ir para Login</Button>
       </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-full max-w-md space-y-8 bg-surface-elevated/40 p-8 rounded-[2.5rem] border backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Nova Senha</h1>
          <p className="text-muted-foreground">Digite sua nova senha abaixo.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 h-12 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg bg-ocean hover:bg-ocean/90" disabled={loading}>
            Redefinir Senha
          </Button>
        </form>
      </div>
    </div>
  );
}
