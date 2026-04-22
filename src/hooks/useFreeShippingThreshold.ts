import { useMemo } from 'react';

export function useFreeShippingThreshold() {
  // Logic could be fetched from Firebase config later
  const threshold = 299;
  return threshold;
}
