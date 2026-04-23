import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/src/integrations/firebase/client';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInit() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const targetUid = "LUuBbJoahYVmHIASnnCSX3i4wZ53";
  const bootstrapEmail = "lojadilermanonovo@gmail.com";

  const handlePromote = async () => {
    if (!user) {
      toast.error("Você precisa estar logado.");
      return;
    }

    if (user.email !== bootstrapEmail) {
      toast.error("Apenas o e-mail mestre pode realizar esta ação.");
      return;
    }

    setLoading(true);
    try {
      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
      const { data }: any = await setAdminClaim({ uid: targetUid, isAdmin: true });
      
      setResult(data.message);
      toast.success("Usuário promovido com sucesso!");
      
      // Force token refresh if the current user is the target
      if (user.uid === targetUid) {
        await user.getIdToken(true);
        window.location.href = '/admin';
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao promover usuário: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <Card className="w-full max-w-md border-ocean border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black uppercase flex items-center justify-center gap-2">
            <ShieldCheck className="h-6 w-6 text-ocean" />
            Configuração Admin
          </CardTitle>
          <CardDescription>
            Ferramenta para liberar acesso ao painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-xl text-xs font-mono space-y-1">
            <p><span className="font-bold">UID Alvo:</span> {targetUid}</p>
            <p><span className="font-bold">Solicitante:</span> {user?.email || 'Desconectado'}</p>
          </div>

          {!user ? (
            <div className="flex items-center gap-2 p-4 text-amber-600 bg-amber-50 rounded-xl">
               <AlertCircle className="h-5 w-5" />
               <p className="text-sm font-medium">Faça login para continuar.</p>
            </div>
          ) : user.email !== bootstrapEmail ? (
            <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-xl">
               <AlertCircle className="h-5 w-5" />
               <p className="text-sm font-medium">Acesso negado para este e-mail.</p>
            </div>
          ) : (
            <Button 
                onClick={handlePromote} 
                disabled={loading}
                className="w-full h-14 rounded-xl font-bold text-lg bg-ocean hover:bg-ocean/90 gap-2 shadow-lg shadow-ocean/20"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              Liberar Acesso Admin
            </Button>
          )}

          {result && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-center text-sm font-bold">
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
