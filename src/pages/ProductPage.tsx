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

const COLOR_MAP: Record<string, string> = {
  'Preto': '#000000',
  'Branco': '#ffffff',
  'Azul': '#3b82f6',
  'Vermelho': '#ef4444',
  'Verde': '#10b981',
  'Amarelo': '#eab308',
  'Rosa': '#ec4899',
  'Cinza': '#6b7280',
  'Marrom': '#78350f',
  'Bege': '#f5f5dc'
};

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const productData: any = { id: productDoc.id, ...(productDoc.data() as any) };

          if (productData.categoryId) {
            try {
              const categoryDoc = await getDoc(doc(db, 'categories', productData.categoryId));
              if (categoryDoc.exists()) {
                productData.category = { id: categoryDoc.id, ...(categoryDoc.data() as any) };
              }
            } catch (catErr) {
              console.error("ProductPage: Error loading category", catErr);
            }
          }

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
      } catch (err: any) {
        if (err?.message?.includes('Database') && err?.message?.includes('not found')) {
          console.warn("ProductPage: Firestore database not found.");
        } else {
          console.error("ProductPage: Error fetching data:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = () => {
    const categorySizes = product?.category?.allowedSizes;
    const productSizes = product?.selectedSizes;
    const sizesToDisplay = (categorySizes && categorySizes.length > 0)
      ? categorySizes
      : (productSizes && productSizes.length > 0)
        ? productSizes
        : ['P', 'M', 'G', 'GG'];

    if (sizesToDisplay.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho');
      return;
    }

    if (product.selectedColors?.length > 0 && !selectedColor) {
      toast.error('Por favor, selecione uma cor');
      return;
    }

    const attributes: Record<string, string> = {};
    if (selectedSize) attributes['Tamanho'] = selectedSize;
    if (selectedColor) attributes['Cor'] = selectedColor;

    // Generate accurate variant identifier for cart unique matching group
    const variantId = (selectedSize || selectedColor) 
      ? `${selectedSize || ''}-${selectedColor || ''}`.trim()
      : undefined;

    addItem({
      productId: product.id,
      variantId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.images?.[0]?.url,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined
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

          {/* Dynamic Colors Selection Section */}
          {product.selectedColors && product.selectedColors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Selecione a Cor</h3>
              <div className="flex flex-wrap gap-3">
                {product.selectedColors.map((colorName: string) => {
                  const hex = COLOR_MAP[colorName] || '#cccccc';
                  const isSelected = selectedColor === colorName;
                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => setSelectedColor(colorName)}
                      className={`h-10 items-center flex gap-2 pl-2.5 pr-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-ocean bg-ocean/5 text-ocean ring-2 ring-ocean/10 shadow-sm' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                      title={colorName}
                    >
                      <span 
                        className="w-4.5 h-4.5 rounded-md border border-slate-300 flex-shrink-0" 
                        style={{ backgroundColor: hex }} 
                      />
                      <span>{colorName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Sizes Selection Section */}
          {(() => {
            const categorySizes = product?.category?.allowedSizes;
            const productSizes = product?.selectedSizes;
            const sizesToDisplay = (categorySizes && categorySizes.length > 0)
              ? categorySizes
              : (productSizes && productSizes.length > 0)
                ? productSizes
                : ['P', 'M', 'G', 'GG'];

            if (sizesToDisplay.length === 0) return null;

            return (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Selecione o Tamanho</h3>
                  {product?.category?.allowedSizes && product.category.allowedSizes.length > 0 && (
                    <span className="text-[10px] text-ocean font-bold bg-ocean/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Grade da Categoria
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesToDisplay.map((size: string) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'default' : 'outline'}
                      className={`h-12 w-12 p-0 font-bold rounded-xl transition-all ${
                        selectedSize === size 
                          ? 'bg-ocean hover:bg-ocean/90 text-white border-ocean shadow-md shadow-ocean/15' 
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })()}

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
                 {shippingOptions.length > 0 && (
                   <div className="space-y-2 pt-2 border-t text-left">
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Opções reais Melhor Envio:</p>
                     <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                       {shippingOptions.map((opt: any) => (
                         <div key={opt.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 border rounded-xl">
                           <div className="flex items-center gap-2">
                             {opt.picture && <img src={opt.picture} className="h-4 w-6 object-contain" alt="" referrerPolicy="no-referrer" />}
                             <span className="font-semibold">{opt.name}</span>
                           </div>
                           <div className="text-right">
                             <span className="font-bold text-blue-600 block">
                               {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(opt.price)}
                             </span>
                             <span className="text-[10px] text-slate-400">{opt.days} dias úteis</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
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
                      disabled={calculatingShipping}
                      onClick={async () => {
                        const zip = (document.getElementById('zip-input') as HTMLInputElement).value;
                        const cleanZip = zip.replace(/\D/g, '');
                        if (cleanZip.length !== 8) {
                          toast.error('CEP inválido! Digite um CEP com 8 dígitos.');
                          return;
                        }
                        
                        setCalculatingShipping(true);
                        setShippingOptions([]);
                        try {
                          const calculateShipping = httpsCallable(functions, 'calculateShipping');
                          const result: any = await calculateShipping({ zipCode: cleanZip });
                          if (result.data && result.data.options && result.data.options.length > 0) {
                            setShippingOptions(result.data.options);
                            toast.success('Opções de frete carregadas!');
                          } else {
                            toast.warning('Melhor Envio não retornou opções de frete para este CEP.');
                          }
                        } catch (e: any) {
                          console.error("[F12 DEBUG] Falha ao chamar a Cloud Function 'calculateShipping':", e);
                          toast.error(e.message || 'Erro ao calcular frete com Melhor Envio');
                        } finally {
                          setCalculatingShipping(false);
                        }
                      }}
                    >
                      {calculatingShipping ? '...' : 'OK'}
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
