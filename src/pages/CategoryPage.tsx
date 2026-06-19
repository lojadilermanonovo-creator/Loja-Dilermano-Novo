import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import ProductCard from '@/src/components/ProductCard';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function CategoryPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        let categoryData = null;
        let productsQuery;

        // Virtual Categories Handle
        if (id === 'novidades') {
          categoryData = { name: 'Novidades', description: 'Confira os últimos lançamentos da Dilermano.' };
          productsQuery = query(
            collection(db, 'products'),
            where('isNew', '==', true),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
          );
        } else if (id === 'promocoes') {
          categoryData = { name: 'Promoções', description: 'As melhores ofertas selecionadas para você.' };
          productsQuery = query(
            collection(db, 'products'),
            where('isActive', '==', true)
          );
        } else if (id === 'destaques') {
          categoryData = { name: 'Destaques', description: 'Os produtos mais procurados da nossa loja.' };
          productsQuery = query(
            collection(db, 'products'),
            where('isFeatured', '==', true),
            where('isActive', '==', true)
          );
        } else {
          // Real Category
          let targetId = id;
          let categoryDoc = await getDoc(doc(db, 'categories', id));
          if (categoryDoc.exists()) {
            categoryData = { id: categoryDoc.id, ...(categoryDoc.data() as object) };
          } else {
            // Check if it's masculine or feminine route and try to locate by matching name (e.g. "Masculina" or "Feminina")
            const normalizedId = id.toLowerCase();
            const nameVariants = normalizedId === 'masculino' 
              ? ['Masculino', 'Masculina'] 
              : normalizedId === 'feminino' 
                ? ['Feminino', 'Feminina'] 
                : [];
            
            if (nameVariants.length > 0) {
              const qCat = query(collection(db, 'categories'), where('name', 'in', nameVariants));
              const catSnap = await getDocs(qCat);
              if (!catSnap.empty) {
                const foundDoc = catSnap.docs[0];
                categoryDoc = foundDoc;
                categoryData = { id: foundDoc.id, ...(foundDoc.data() as object) };
                targetId = foundDoc.id;
              }
            }
          }
          productsQuery = query(
            collection(db, 'products'),
            where('categoryId', '==', targetId),
            where('isActive', '==', true)
          );
        }

        setCategory(categoryData);
        if (productsQuery) {
          const productsSnap = await getDocs(productsQuery);
          let productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
          
          if (id === 'promocoes') {
            productsList = productsList.filter(p => p.originalPrice && p.originalPrice > p.price);
          }
          setProducts(productsList);
        }
      } catch (err: any) {
        if (err?.message?.includes('Database') && err?.message?.includes('not found')) {
          console.warn("CategoryPage: Firestore database not found.");
        } else {
          console.error("CategoryPage: Error fetching data:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            {category?.name || 'Categoria'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {category?.description || 'Explore nossa seleção de produtos.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtrar Produtos</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                 <div>
                   <h3 className="font-bold mb-3">Tamanho</h3>
                   <div className="flex flex-wrap gap-2">
                     {['P', 'M', 'G', 'GG'].map(s => (
                       <Button key={s} variant="outline" size="sm" className="w-10 rounded-lg">{s}</Button>
                     ))}
                   </div>
                 </div>
                 <div>
                   <h3 className="font-bold mb-3">Preço</h3>
                   <div className="space-y-2">
                     <Button variant="ghost" size="sm" className="w-full justify-start">Até R$ 100</Button>
                     <Button variant="ghost" size="sm" className="w-full justify-start">R$ 100 a R$ 300</Button>
                     <Button variant="ghost" size="sm" className="w-full justify-start">Acima de R$ 300</Button>
                   </div>
                 </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <select className="bg-transparent border rounded-xl px-4 h-10 text-sm font-medium outline-none">
            <option>Ordenar por</option>
            <option>Menor Preço</option>
            <option>Maior Preço</option>
            <option>Mais Recentes</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
          <Button variant="link" onClick={() => window.history.back()}>Voltar</Button>
        </div>
      )}
    </div>
  );
}
