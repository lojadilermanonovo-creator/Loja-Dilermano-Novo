import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, functions } from '@/src/integrations/firebase/client';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Truck, ShieldCheck, ArrowLeft, Star } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/src/components/ProductCard';
import { Separator } from '@/components/ui/separator';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      const productDoc = await getDoc(doc(db, 'products', id));
      if (productDoc.exists()) {
        const productData: any = { id: productDoc.id, ...(productDoc.data() as any) };
        setProduct(productData);

        // Fetch related products from same category
        const relatedQuery = query(
          collection(db, 'products'),
          where('categoryId', '==', productData.categoryId),
          where('isActive', '==', true),
          limit(4)
        );
        const relatedSnap = await getDocs(relatedQuery);
        setRelatedProducts(
          relatedSnap.docs
            .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
            .filter(p => p.id !== id)
        );
      }
      setLoading(false);
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = () => {
    if (product.variants?.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.images?.[0]?.url,
      attributes: selectedSize ? { Tamanho: selectedSize } : undefined
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">Produto não encontrado</h2>
        <Button variant="link" onClick={() => navigate('/')} className="mt-4">Voltar para a Home</Button>
      </div>
    );
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const images = product.images?.length > 0 ? product.images : [{ url: 'https://images.unsplash.com/photo-1523381235312-3a1683935450?q=80&w=2070&auto=format&fit=crop' }];

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-surface-elevated">
            <img 
              src={images[selectedImage]?.url} 
              alt={product.name} 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {images.slice(0, 3).map((img: any, index: number) => (
              <button 
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === index ? 'border-ocean' : 'border-transparent'
                }`}
              >
                <img src={img.url} className="h-full w-full object-cover" alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-max">
            {product.isNew && <Badge className="bg-ocean text-white mb-2">NOVO</Badge>}
            <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">{product.name}</h1>
            <div className="flex items-center gap-1 text-yellow-500 mt-2">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <span className="text-xs text-muted-foreground ml-2">(48 avaliações)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
             <span className="text-3xl font-black text-primary">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
             </span>
             {hasDiscount && (
               <span className="text-lg text-muted-foreground line-through decoration-sunset">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)}
               </span>
             )}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {product.description || product.shortDescription || "Este item combina elegância e conforto, perfeito para qualquer ocasião."}
          </p>

          {/* Dummy Sizes for Demo - In real app fetch from product.variants */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider">Tamanho</h3>
            <div className="flex flex-wrap gap-2">
              {['P', 'M', 'G', 'GG'].map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? 'default' : 'outline'}
                  className={`h-12 w-12 p-0 font-bold rounded-xl ${selectedSize === size ? 'bg-ocean' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-xl overflow-hidden h-14">
                <button 
                  className="px-4 hover:bg-surface-elevated font-bold"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input 
                  type="text" 
                  value={quantity} 
                  className="w-12 text-center font-bold outline-none"
                  readOnly 
                />
                <button 
                  className="px-4 hover:bg-surface-elevated font-bold"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
              <Button 
                className="flex-1 h-14 rounded-xl font-bold text-lg bg-ocean hover:bg-ocean/90 gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4">
             <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-elevated/50">
               <Truck className="h-5 w-5 text-ocean" />
               <div>
                  <p className="text-sm font-bold">Frete Grátis</p>
                  <p className="text-xs text-muted-foreground">Em compras acima de R$ 299,00</p>
               </div>
             </div>
             <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-elevated/50">
               <ShieldCheck className="h-5 w-5 text-ocean" />
               <div>
                  <p className="text-sm font-bold">Compra Segura</p>
                  <p className="text-xs text-muted-foreground">Seus dados protegidos com criptografia total.</p>
               </div>
             </div>

             <div className="p-4 rounded-2xl border-2 space-y-4">
                <div className="flex items-center gap-2">
                   <Truck className="h-4 w-4 text-ocean" />
                   <h3 className="text-xs font-bold uppercase tracking-widest">Calcular Frete</h3>
                </div>
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Digite seu CEP" 
                     className="flex-1 bg-surface-elevated h-10 px-3 rounded-lg text-sm border-none outline-none"
                     id="zip-input"
                   />
                   <Button 
                     size="sm" 
                     className="rounded-lg h-10 px-4 font-bold"
                     onClick={async () => {
                       const zip = (document.getElementById('zip-input') as HTMLInputElement).value;
                       if (!zip) return;
                       try {
                         const calculateShipping = httpsCallable(functions, 'calculateShipping');
                         const { data }: any = await calculateShipping({ zipCode: zip });
                         toast.success(`Cálculo realizado: ${data.options[0].name} - R$ ${data.options[0].price}`);
                       } catch (e) {
                         toast.error('Erro ao calcular frete');
                       }
                     }}
                   >
                     OK
                   </Button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <Separator className="my-16" />

      {relatedProducts.length > 0 && (
        <section className="pb-16 space-y-8">
           <h2 className="text-2xl font-black tracking-tighter">Você também pode gostar</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
           </div>
        </section>
      )}
    </div>
  );
}
