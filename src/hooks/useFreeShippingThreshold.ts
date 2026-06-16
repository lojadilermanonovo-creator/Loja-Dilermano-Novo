import { useState, useEffect } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';

export function useFreeShippingThreshold() {
  const [threshold, setThreshold] = useState<number>(299);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'promocta'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && typeof data.value === 'number' && !isNaN(data.value)) {
            setThreshold(data.value);
          } else {
            setThreshold(299); // Fallback if data.value is null, undefined, or NaN
          }
        } else {
          setThreshold(299); // Fallback if document doesn't exist
        }
      },
      (err) => {
        console.warn("useFreeShippingThreshold: Could not load promocta value dynamically, using default.", err);
        setThreshold(299); // Fallback on firestore error
      }
    );
    return () => unsub();
  }, []);

  return threshold;
}

