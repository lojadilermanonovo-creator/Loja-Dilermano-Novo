import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import AdminSidebar from '@/src/components/AdminSidebar';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { db } from '@/src/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminBrandName, setAdminBrandName] = useState('Dilermando');

  useEffect(() => {
    const fetchBrandName = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminBrandName) {
            setAdminBrandName(data.adminBrandName);
          }
        }
      } catch (err) {
        console.error('Error fetching admin brand name:', err);
      }
    };
    fetchBrandName();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer (using Framer Motion) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 max-w-[80vw] h-full flex flex-col z-10"
            >
              {/* Close Button on sidebar */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-lg bg-slate-800/80 border border-slate-750"
              >
                <X className="h-5 w-5" />
              </button>
              
              <AdminSidebar onClose={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Topbar (visible only on mobile) */}
        <header className="lg:hidden h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md text-white">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span className="font-black tracking-tighter text-slate-900 text-lg uppercase">
              {adminBrandName}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-slate-200"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
        </header>

        {/* Primary Page Canvas */}
        <main className="flex-grow overflow-y-auto relative bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
