import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/src/integrations/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, UserPlus, User } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      try {
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (dbErr: any) {
        // Log the error but don't stop the registration flow
        if (dbErr?.message?.includes('Database') && dbErr?.message?.includes('not found')) {
          console.warn("Register: Profile doc not created because Firestore is not configured yet.");
        } else {
          console.error("Register: Error creating profile doc:", dbErr);
        }
      }

      toast.success('Conta criada com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error('Erro ao criar conta. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-full max-w-md space-y-8 bg-surface-elevated/40 p-8 rounded-[2.5rem] border backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Criar Conta</h1>
          <p className="text-muted-foreground">Junte-se à família Dilermano.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="name" 
                type="text" 
                placeholder="Seu Nome" 
                className="pl-10 h-12 rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
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

          <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg bg-ocean hover:bg-ocean/90 gap-2" disabled={loading}>
             <UserPlus className="h-5 w-5" /> Cadastrar
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-ocean font-bold hover:underline">Logar-se</Link>
        </p>
      </div>
    </div>
  );
}
