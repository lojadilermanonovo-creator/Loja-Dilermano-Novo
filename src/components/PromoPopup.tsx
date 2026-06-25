import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/src/integrations/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { X, Send, Mail, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
  layout?: 'horizontal' | 'vertical';
  bgColor?: string;
  titleColor?: string;
  textColor?: string;
  btnBgColor?: string;
  btnTextColor?: string;
}

// In-memory module state to avoid reopening on client-side route transitions
let hasShownPromoPopupInThisLoad = false;
let isScheduledInThisRun = false;

export default function PromoPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

    // 1. Check if already shown or dismissed in current page load session (prevents showing multiple times in the same session)
    if (hasShownPromoPopupInThisLoad) {
      return;
    }

    // 2. Check local storage lock (if oncePerVisitor is enabled, prevent showing to the same visitor across sessions)
    if (popup.oncePerVisitor) {
      const visitorDismissed = localStorage.getItem('dilermano_popup_visitor_dismissed');
      if (visitorDismissed === 'true') {
        return;
      }
    } else {
      // If oncePerVisitor is disabled, we clean up any old visitor dismiss local storage
      // so that if they later disable it, it doesn't accidentally block them.
      localStorage.removeItem('dilermano_popup_visitor_dismissed');
    }

    // 3. Avoid setting multiple simultaneous timeouts
    if (isScheduledInThisRun) {
      return;
    }

    // Delay trigger
    const delayMs = (popup.delaySeconds || 5) * 1000;
    isScheduledInThisRun = true;
    const timer = setTimeout(() => {
      setIsOpen(true);
      // Mark as shown in this session immediately when it opens
      hasShownPromoPopupInThisLoad = true;
    }, delayMs);

    return () => {
      clearTimeout(timer);
      isScheduledInThisRun = false;
    };
  }, [popup]);

  // Handle checking and executing pending action after login
  useEffect(() => {
    if (user) {
      const pendingActionStr = sessionStorage.getItem('dilermano_pending_popup_action');
      if (pendingActionStr) {
        try {
          const pendingAction = JSON.parse(pendingActionStr);
          if (pendingAction && pendingAction.buttonAction && pendingAction.buttonDestination) {
            executeAction(pendingAction.buttonAction, pendingAction.buttonDestination);
          }
        } catch (e) {
          console.error("Error parsing pending popup action:", e);
        } finally {
          sessionStorage.removeItem('dilermano_pending_popup_action');
        }
      }
    }
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    hasShownPromoPopupInThisLoad = true;
    
    // Persist as visitor if set
    if (popup?.oncePerVisitor) {
      localStorage.setItem('dilermano_popup_visitor_dismissed', 'true');
    }
  };

  const executeAction = (actionType: 'whatsapp' | 'email' | 'link', destination: string) => {
    if (!destination) return;

    if (actionType === 'whatsapp') {
      // Clean phone number
      const cleanPhone = destination.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá! Vi o anúncio no site e gostaria de saber mais.')}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (actionType === 'email') {
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

  const handleActionClick = () => {
    if (!popup) return;

    // Check if login is required first
    if (!user) {
      // Save pending action
      const pendingAction = {
        buttonAction: popup.buttonAction,
        buttonDestination: popup.buttonDestination,
      };
      sessionStorage.setItem('dilermano_pending_popup_action', JSON.stringify(pendingAction));

      // Dismiss popup
      handleClose();

      // Redirect to login
      const currentPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${currentPath}`);
      return;
    }

    // User is logged in, execute action normally
    handleClose();
    executeAction(popup.buttonAction, popup.buttonDestination);
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

  // Extract styles or fallbacks
  const isVertical = popup.layout === 'vertical';
  const customBgColor = popup.bgColor || '#FFFFFF';
  const customTitleColor = popup.titleColor || '#0F172A';
  const customTextColor = popup.textColor || '#475569';
  const customBtnBgColor = popup.btnBgColor || '#2563EB';
  const customBtnTextColor = popup.btnTextColor || '#FFFFFF';

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
          className={`relative rounded-3xl overflow-hidden shadow-2xl w-full border border-slate-100 z-10 ${
            isVertical 
              ? 'max-w-md flex flex-col text-center' 
              : 'max-w-2xl flex flex-col md:flex-row text-center md:text-left'
          }`}
          style={{ backgroundColor: customBgColor }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-slate-100/80 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-full p-2 transition-all shadow-md cursor-pointer backdrop-blur-sm"
            aria-label="Fechar"
            id="btn-close-popup"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image - displays on left for horizontal and top for vertical */}
          {popup.imageUrl ? (
            <div className={`relative bg-slate-50 shrink-0 ${
              isVertical ? 'w-full h-48 md:h-56' : 'md:w-1/2 h-48 md:h-auto'
            }`}>
              <img
                src={popup.imageUrl}
                alt={popup.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${
                isVertical ? 'from-black/10 to-transparent' : 'md:bg-gradient-to-r from-transparent via-transparent to-white/10'
              }`} />
            </div>
          ) : (
            <div className={`bg-slate-50/50 items-center justify-center shrink-0 relative overflow-hidden ${
              isVertical ? 'w-full h-24 flex border-b border-slate-100' : 'hidden md:flex md:w-1/3 border-r border-slate-100'
            }`}>
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-60" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-100 rounded-full blur-2xl opacity-60" />
              <div className="text-center p-6 space-y-1 z-10">
                <div className="bg-blue-50 text-blue-600 rounded-2xl p-3.5 w-12 h-12 mx-auto flex items-center justify-center shadow-sm">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Content area */}
          <div className={`flex-1 flex flex-col justify-center space-y-6 ${
            isVertical ? 'p-6 md:p-8' : 'p-8 md:p-10'
          }`}>
            <div className="space-y-3">
              <span 
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                style={{ backgroundColor: `${customBtnBgColor}15`, color: customBtnBgColor }}
              >
                <Sparkles className="h-3 w-3 animate-pulse" /> Oferta Especial
              </span>
              <h3 
                className="text-2xl md:text-3xl font-black tracking-tight leading-none uppercase"
                style={{ color: customTitleColor }}
              >
                {popup.title}
              </h3>
              {popup.text && (
                <p 
                  className="text-sm font-medium leading-relaxed whitespace-pre-line"
                  style={{ color: customTextColor }}
                >
                  {popup.text}
                </p>
              )}
            </div>

            <button
              onClick={handleActionClick}
              className="w-full font-black text-sm uppercase tracking-wider py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 transform active:scale-95 hover:brightness-105"
              style={{ backgroundColor: customBtnBgColor, color: customBtnTextColor }}
              id="btn-popup-cta"
            >
              {getActionIcon()}
              {popup.buttonText}
            </button>

            <button
              onClick={handleClose}
              className="text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors opacity-60 hover:opacity-100"
              style={{ color: customTextColor }}
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
