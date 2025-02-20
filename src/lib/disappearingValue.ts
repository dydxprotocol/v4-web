import { useEffect, useRef, useState } from 'react';

import { timeUnits } from '@/constants/time';

/**
 * A hook that manages a value that automatically disappears after a specified duration
 *
 * @param duration Time in milliseconds before the value disappears (default: 30s)
 * @returns [currentValue, setValue] tuple
 */
export const useDisappearingValue = <T>(duration = timeUnits.second * 30) => {
  const [value, setValue] = useState<T | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Clear timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const setValueWithTimeout = (newValue: T | undefined) => {
    clearTimeout(timeoutRef.current);
    setValue(newValue);

    if (newValue !== undefined) {
      timeoutRef.current = setTimeout(() => {
        setValue(undefined);
      }, duration);
    }
  };

  return [value, setValueWithTimeout] as const;
};
