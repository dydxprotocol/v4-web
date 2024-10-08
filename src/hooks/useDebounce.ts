import { useEffect, useState } from 'react';

import { MODERATE_DEBOUNCE_MS } from '@/constants/debounce';

/**
 * https://usehooks-ts.com/react-hook/use-debounce
 * @param value
 * @param delay
 * @returns the debouncedValue
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay ?? MODERATE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
