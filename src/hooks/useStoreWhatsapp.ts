import { useState, useEffect } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';

export const DEFAULT_WHATSAPP_NUMBER = "5591983997964";

export function useStoreWhatsapp() {
  const [whatsapp, setWhatsapp] = useState<string>(DEFAULT_WHATSAPP_NUMBER);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.whatsapp) {
            // Clean non-digits just to ensure safe formatting/cleaning in URL
            const clean = data.whatsapp.replace(/\D/g, '');
            if (clean) {
              setWhatsapp(clean);
              return;
            }
          }
        }
        setWhatsapp(DEFAULT_WHATSAPP_NUMBER);
      },
      (err) => {
        console.warn("useStoreWhatsapp: Could not load general settings dynamically, using default.", err);
        setWhatsapp(DEFAULT_WHATSAPP_NUMBER);
      }
    );
    return () => unsub();
  }, []);

  return whatsapp;
}
