import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '@/src/integrations/firebase/client';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const STATIC_SLIDES = [
  {
    id: 'static-1',
    title: "Sua melhor versão começa aqui",
    subtitle: "Coleção Outono/Inverno 2026 já disponível.",
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop",
    color: "bg-ocean"
  },
  {
    id: 'static-2',
    title: "Estilo que inspira",
    subtitle: "Peças exclusivas selecionadas para você.",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop",
    color: "bg-sunset"
  }
];

export default function HeroCarousel() {
  const [slides, setSlides] = useState<any[]>(STATIC_SLIDES);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const q = query(
          collection(db, 'banners'),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setSlides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        // Fallback silently or fetch simple get if index is not ready yet
        try {
          const snap = await getDocs(collection(db, 'banners'));
          const activeList = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() as any }))
            .filter(b => b.isActive !== false);
          if (activeList.length > 0) {
            setSlides(activeList);
          }
        } catch (e) {
          console.warn("Banners collection fallback loaded STATIC_SLIDES:", e);
        }
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  const handleScrollToCategories = () => {
    document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (slides.length === 0) return null;

  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[current].imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="container mx-auto h-full px-4 relative z-10 flex flex-col justify-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-2xl text-white space-y-6"
            >
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none whitespace-pre-line uppercase">
                {slides[current].title}
              </h1>
              <p className="text-lg md:text-2xl text-white/90">
                {slides[current].subtitle}
              </p>
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="font-bold h-14 px-10 rounded-full text-lg shadow-xl bg-white text-black hover:bg-neutral-200"
                  onClick={handleScrollToCategories}
                >
                  Comprar Agora
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  i === current ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-md"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button 
            onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-md"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}
