import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/src/contexts/CartContext';
import { toast } from 'sonner';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images?: { url: string }[];
    isNew?: boolean;
    stockQuantity?: number;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const imageUrl = product.images?.[0]?.url || "https://images.unsplash.com/photo-1523381235312-3a1683935450?q=80&w=2070&auto=format&fit=crop";
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="group relative flex flex-col gap-3">
      <Link to={`/produto/${product.id}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-elevated">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-ocean text-white border-none font-bold">NOVO</Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-sunset text-white border-none font-bold">PROMO</Badge>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
          <Button size="icon" variant="secondary" className="rounded-full shadow-lg" asChild>
            <Link to={`/produto/${product.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="icon" className="rounded-full shadow-lg bg-white text-black hover:bg-ocean hover:text-white" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <Link to={`/produto/${product.id}`} className="text-sm font-medium hover:text-ocean transition-colors line-clamp-2">
          {product.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
