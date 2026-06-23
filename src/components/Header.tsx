import { ShoppingCart, User, Menu, Search, X, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/src/contexts/CartContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-lg font-semibold">Home</Link>
                <Link to="/categoria/novidades" className="text-lg">Novidades</Link>
                <Link to="/categoria/promocoes" className="text-lg">Promoções</Link>
                <Link to="/categoria/masculino" className="text-lg">Masculino</Link>
                <Link to="/categoria/feminino" className="text-lg">Feminino</Link>
                <Link to="/favoritos" className="text-lg flex items-center gap-2 text-rose-600 font-bold">
                  <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                  Meus Favoritos
                </Link>
                {isAdmin && (
                   <Link to="/admin" className="text-lg font-bold text-ocean">Painel Admin</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter text-primary">DILERMANO</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="transition-colors hover:text-ocean">Home</Link>
          <Link to="/categoria/novidades" className="transition-colors hover:text-ocean">Novidades</Link>
          <Link to="/categoria/promocoes" className="transition-colors hover:text-ocean">Promoções</Link>
          <Link to="/categoria/masculino" className="transition-colors hover:text-ocean">Masculino</Link>
          <Link to="/categoria/feminino" className="transition-colors hover:text-ocean">Feminino</Link>
          {isAdmin && (
            <Link to="/admin" className="transition-colors hover:text-ocean font-bold">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <Search className="h-5 w-5" />
          </Button>

          <Link to="/favoritos" className="flex items-center gap-1 bg-transparent hover:bg-slate-50 transition-colors py-1.5 px-3 rounded-xl text-slate-700 hover:text-rose-600 ring-offset-background focus-visible:outline-none">
            <Heart className="h-5 w-5 text-rose-500 hover:scale-110 transition-all" />
            <span className="hidden lg:inline text-xs font-bold leading-none">Meus Favoritos</span>
          </Link>

          <Link to={user ? "/conta" : "/login"}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          <Link to="/carrinho">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ocean text-[10px] text-white">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
      
      {isSearchOpen && (
        <div className="border-t bg-background p-4 animate-in slide-in-from-top duration-200">
           <div className="container mx-auto flex items-center gap-2">
             <Search className="h-4 w-4 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="O que você está procurando?" 
               className="flex-1 bg-transparent py-2 outline-none"
               autoFocus
             />
             <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
               <X className="h-4 w-4" />
             </Button>
           </div>
        </div>
      )}
    </header>
  );
}
