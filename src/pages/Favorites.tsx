import React from 'react';
import { useWishlist } from '@/src/contexts/WishlistContext';
import ProductCard from '@/src/components/ProductCard';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Favorites() {
  const { wishlistItems, loading } = useWishlist();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 mb-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar para o início
          </Link>
        </div>
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none flex items-center gap-4">
            Meus Favoritos <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
          </h1>
          <p className="text-muted-foreground text-lg">
            Sua lista de peças e produtos favoritos. Veja e gerencie suas escolhas abaixo.
          </p>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-20 px-4 space-y-6 max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 mb-2">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Sua lista está vazia</h3>
          <p className="text-muted-foreground">
            Você ainda não salvou nenhum produto. Navegue por nossa loja e monte sua seleção perfeita!
          </p>
          <Button asChild className="w-full h-12 rounded-xl bg-ocean hover:bg-ocean/90 text-white font-bold gap-2">
            <Link to="/">
              <ShoppingBag className="h-5 w-5" /> Explorar Loja
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-6">
          {wishlistItems.map((item) => {
            const productProp = {
              id: item.productId,
              name: item.name,
              price: item.price,
              images: item.imageUrl ? [{ url: item.imageUrl }] : []
            };
            return (
              <ProductCard key={item.productId} product={productProp} />
            );
          })}
        </div>
      )}
    </div>
  );
}
