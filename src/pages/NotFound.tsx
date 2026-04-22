import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Ghost } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center gap-6">
      <Ghost className="h-24 w-24 text-muted-foreground animate-bounce" />
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold">Página não encontrada</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Desculpe, o conteúdo que você está procurando não existe ou foi movido para outro endereço.
        </p>
      </div>
      <Link to="/">
        <Button size="lg" className="rounded-xl h-14 px-10 font-bold bg-ocean mt-4">Voltar para a Segurança</Button>
      </Link>
    </div>
  );
}
