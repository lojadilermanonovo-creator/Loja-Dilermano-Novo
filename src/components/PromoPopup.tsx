import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/src/integrations/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { X, Send, Mail, Link as LinkIcon, Sparkles } from 'lucide-react';

interface PopupData {
  active: boolean;
  title: string;
  text: string;
  imageUrl: string;
  buttonText: string;
  buttonAction: 'whatsapp' | 'email' | 'link';
  buttonDestination: string;
  delaySeconds: number;
  oncePerVisitor: boolean;
}

export default function PromoPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Live listen to popup settings
    const unsub = onSnapshot(doc(db, 'settings', 'popup'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PopupData;
        setPopup(data);
      } else {
        setPopup(null);
      }
    }, (err) => {
      console.warn("Could not load popup settings:", err);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!popup || !popup.active) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed in current session
    const sessionDismissed = sessionStorage.getItem('dilermano_popup_session_dismissed');
    if (sessionDismissed === 'true') {
      return;
    }

    // Check if dismissed as visitor (localStorage)
    if (popup.oncePerVisitor) {
      const visitorDismissed = localStorage.getItem('dilermano_popup_visitor_dismissed');
      if (visitorDismissed === 'true') {
        return;
      }
    }

    // Delay trigger
    const delayMs = (popup.delaySeconds || 5) * 1000;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [popup]);

  const handleClose = () => {
    setIsOpen(false);
    // Persist in session
    sessionStorage.setItem('dilermano_popup_session_dismissed', 'true');
    // Persist as visitor if set
    if (popup?.oncePerVisitor) {
      localStorage.setItem('dilermano_popup_visitor_dismissed', 'true');
    }
  };

  const handleActionClick = () => {
    if (!popup) return;

    // First dismiss so it doesn't reappear
    handleClose();

    const destination = popup.buttonDestination || '';
    if (!destination) return;

    if (popup.buttonAction === 'whatsapp') {
      // Clean phone number
      const cleanPhone = destination.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá! Vi o anúncio no site e gostaria de saber mais.')}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (popup.buttonAction === 'email') {
      window.location.href = `mailto:${destination}`;
    } else {
      // Custom link
      if (destination.startsWith('http://') || destination.startsWith('https://') || destination.startsWith('/')) {
        window.open(destination, destination.startsWith('/') ? '_self' : '_blank', 'noopener,noreferrer');
      } else {
        window.open(`https://${destination}`, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (!popup || !isOpen) return null;

  const getActionIcon = () => {
    switch (popup.buttonAction) {
      case 'whatsapp':
        return <Send className="h-4.5 w-4.5" />;
      case 'email':
        return <Mail className="h-4.5 w-4.5" />;
      default:
        return <LinkIcon className="h-4.5 w-4.5" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.45 }}
          className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col md:flex-row border border-slate-100 z-10"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-full p-2 transition-all shadow-md cursor-pointer"
            aria-label="Fechar"
            id="btn-close-popup"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left Column (Image) - only displays if imageUrl exists */}
          {popup.imageUrl ? (
            <div className="md:w-1/2 h-48 md:h-auto relative bg-slate-50 shrink-0">
              <img
                src={popup.imageUrl}
                alt={popup.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-white/10" />
            </div>
          ) : (
            <div className="hidden md:flex md:w-1/3 bg-slate-50 items-center justify-center border-r border-slate-100 shrink-0 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-60" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-100 rounded-full blur-2xl opacity-60" />
              <div className="text-center p-6 space-y-2 z-10">
                <div className="bg-blue-50 text-blue-600 rounded-2xl p-4 w-14 h-14 mx-auto flex items-center justify-center shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Oferta Exclusiva</p>
              </div>
            </div>
          )}

          {/* Right Column (Content) */}
          <div className="flex-1 p-8 md:p-10 flex flex-col justify-center space-y-6 text-center md:text-left">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles className="h-3 w-3 animate-pulse" /> Novidade Especial
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight leading-none uppercase">
                {popup.title}
              </h3>
              {popup.text && (
                <p className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-line">
                  {popup.text}
                </p>
              )}
            </div>

            <button
              onClick={handleActionClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              id="btn-popup-cta"
            >
              {getActionIcon()}
              {popup.buttonText}
            </button>

            <button
              onClick={handleClose}
              className="text-xs text-slate-400 hover:text-slate-600 font-extrabold uppercase tracking-wider cursor-pointer"
              id="btn-dismiss-popup-text"
            >
              Não, obrigado
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
