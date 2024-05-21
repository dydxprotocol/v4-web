import { useEffect, useState } from 'react';

import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';
import { log } from '@/lib/telemetry';

export const useLocalStorage = <Value>({
  key,
  defaultValue,
  validateFn,
}: {
  key: LocalStorageKey;
  defaultValue: Value;
  validateFn?: (value: Value) => boolean;
}) => {
  const [value, setValue] = useState(getLocalStorage({ key, defaultValue, validateFn }));

  // Sync localStorage values across parallel browser sessions
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (key === e.key) {
        try {
          const newValue = e.newValue ? (JSON.parse(e.newValue) as Value) : undefined;
          if (newValue !== undefined) setValue(newValue);
        } catch (error) {
          log('useLocalStorage/onStorage', error);
          return false;
        }
      }
      return undefined;
    };

    globalThis.window.addEventListener('storage', onStorage);

    return () => globalThis.window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    setLocalStorage({ key, value });
  }, [value]);

  return [value, setValue] as const;
};
