import React, { useEffect, useState } from 'react';
import HeroCarousel from '@/src/components/HeroCarousel';
import CategoryCard from '@/src/components/CategoryCard';
import ProductCard from '@/src/components/ProductCard';
import { db, functions } from '@/src/integrations/firebase/client';
import { collection, query, where, getDocs, limit, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';

export default function Index() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCTA, setPromoCTA] = useState<any>({
    active: true,
    title: 'Frete Grátis acima de R$ {valor}',
    subtitle: 'Aproveite para renovar seu guarda-roupa sem se preocupar com a entrega. Parcele em até {parcelas} sem juros.',
    value: 299,
    installments: 5,
    buttonText: 'Aproveitar Agora',
    buttonLink: '/categoria/promocoes',
    bgColor: '#2563EB',
    textColor: '#FFFFFF',
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading } = useAuth();
  const [exchangeStarted, setExchangeStarted] = useState(false);

  const resolvePlaceholders = (text: string, value: number | '', installments: number | '') => {
    if (!text) return '';
    let result = text;
    if (value !== '') {
      const formattedVal = typeof value === 'number' 
        ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) 
        : String(value);
      result = result.replace(/\{valor\}/g, formattedVal);
    } else {
      result = result.replace(/\{valor\}/g, '');
    }
    if (installments !== '') {
      result = result.replace(/\{parcelas\}/g, `${installments}x`);
    } else {
      result = result.replace(/\{parcelas\}/g, '');
    }
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active categories (max 6)
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc'),
          limit(6)
        );
        const categoriesSnap = await getDocs(categoriesQuery);
        setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));

        // Fetch featured products
        const featuredQuery = query(
          collection(db, 'products'),
          where('isFeatured', '==', true),
          where('isActive', '==', true),
          limit(8)
        );
        const featuredSnap = await getDocs(featuredQuery);
        setFeaturedProducts(featuredSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));

        // Fetch new products
        const newQuery = query(
          collection(db, 'products'),
          where('isNew', '==', true),
          where('isActive', '==', true),
          limit(8)
        );
        const newSnap = await getDocs(newQuery);
        setNewProducts(newSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));

        // Fetch Promo CTA Settings is now handled via real-time onSnapshot below
      } catch (err: any) {
        // Check for "Database not found" specifically to avoid noisy errors
        if (err?.message?.includes('Database') && err?.message?.includes('not found')) {
          console.warn("Home: Firestore database not found yet.");
        } else {
          console.error("Home: Error fetching data:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'promocta'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPromoCTA((prev: any) => ({
          ...prev,
          ...data
        }));
      }
    }, (err) => {
      console.warn("Home: Could not listen to promo CTA settings, using defaults.", err);
    });

    return () => unsubscribe();
  }, []);

  const code = searchParams.get('code');

  useEffect(() => {
    if (!code || authLoading || exchangeStarted) return;

    const handleCallback = async () => {
      setExchangeStarted(true);
      console.log("[MELHOR_ENVIO] Modo Simulado Local Ativo. Código recebido:", code);
      toast.success('Melhor Envio (Modo de Simulação Local Ativo)', { id: 'melhor-envio-connection' });
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/admin/configuracoes');
    };

    handleCallback();
  }, [code, authLoading, exchangeStarted, navigate]);

  return (
    <div className="space-y-12 pb-20">
      <HeroCarousel />

      <section id="categorias" className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Categorias</h2>
          <p className="text-muted-foreground max-w-[600px] mt-2">
            Explore nossas coleções exclusivas e encontre o seu estilo.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))
          ) : (
            <>
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
              {/* Default categories if none found */}
              {categories.length === 0 && [
                { id: 'novidades', name: 'Novidades', imageUrl: 'https://images.unsplash.com/photo-1523381235312-3a1683935450?q=80&w=2070&auto=format&fit=crop' },
                { id: 'promocoes', name: 'Promoções', imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=2070&auto=format&fit=crop' },
                { id: 'masculino', name: 'Masculino', imageUrl: 'https://images.unsplash.com/photo-1516257984877-a03a01ae1b89?q=80&w=2070&auto=format&fit=crop' },
                { id: 'feminino', name: 'Feminino', imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=2070&auto=format&fit=crop' },
                { id: 'acessorios', name: 'Acessórios', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2070&auto=format&fit=crop' },
                { id: 'calcados', name: 'Calçados', imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=2070&auto=format&fit=crop' }
              ].map(cat => (
                 <CategoryCard key={cat.id} category={cat} />
              ))}
            </>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 bg-surface-elevated/50 rounded-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Novidades</h2>
            <p className="text-sm text-muted-foreground">O que acabou de chegar para você.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/categoria/novidades')}>Ver todos</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[4/5] rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            ))
          ) : (
            <>
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {newProducts.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground whitespace-pre-wrap">Nenhum produto em 'Novidades' encontrado. Adicione produtos com a flag 'isNew' no admin.</p>}
            </>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Destaques</h2>
            <p className="text-sm text-muted-foreground">Nossos produtos mais amados.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/categoria/destaques')}>Ver todos</Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[4/5] rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            ))
          ) : (
            <>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {featuredProducts.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground">Nenhum produto em 'Destaques' encontrado. Adicione produtos com a flag 'isFeatured' no admin.</p>}
            </>
          )}
        </div>
      </section>

      {promoCTA && promoCTA.active && (
        <section className="container mx-auto px-4 py-16">
          <div 
            className="rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative"
            style={{ backgroundColor: promoCTA.bgColor || '#2563EB', color: promoCTA.textColor || '#FFFFFF' }}
          >
            <div className="relative z-10 max-w-lg space-y-6">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm" style={{ color: promoCTA.textColor }}>OFERTA ESPECIAL</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                {resolvePlaceholders(promoCTA.title || '', promoCTA.value, promoCTA.installments)}
              </h2>
              <p className="text-lg opacity-90 whitespace-pre-line leading-relaxed">
                {resolvePlaceholders(promoCTA.subtitle || '', promoCTA.value, promoCTA.installments)}
              </p>
              <Button 
                size="lg" 
                className="font-bold h-14 px-8 uppercase hover:opacity-90 transition-opacity" 
                style={{ backgroundColor: promoCTA.textColor, color: promoCTA.bgColor }}
                onClick={() => navigate(promoCTA.buttonLink || '/categoria/promocoes')}
              >
                {promoCTA.buttonText || 'Aproveitar Agora'}
              </Button>
            </div>
            <div className="relative z-10 w-full md:w-1/2 aspect-square max-w-sm">
               <img 
                 src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
                 alt="Oferta Especial" 
                 className="rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
               />
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </section>
      )}
    </div>
  );
}
