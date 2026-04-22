import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/integrations/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success('E-mail de recuperação enviado!');
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail. Verifique o endereço informado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-full max-w-md space-y-8 bg-surface-elevated/40 p-8 rounded-[2.5rem] border backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Recuperar Senha</h1>
          <p className="text-muted-foreground">Enviaremos um link para o seu e-mail.</p>
        </div>

        {sent ? (
          <div className="space-y-6 text-center">
             <div className="p-4 bg-ocean/10 text-ocean rounded-2xl font-medium">
               Verifique sua caixa de entrada para redefinir sua senha.
             </div>
             <Link to="/login">
               <Button variant="link" className="gap-2"> <ArrowLeft className="h-4 w-4" /> Voltar para o Login</Button>
             </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="pl-10 h-12 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg bg-ocean hover:bg-ocean/90" disabled={loading}>
              Enviar Link
            </Button>
            
            <div className="text-center">
               <Link to="/login">
                 <Button variant="link" size="sm" className="gap-2"> <ArrowLeft className="h-4 w-4" /> Voltar para o Login</Button>
               </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
