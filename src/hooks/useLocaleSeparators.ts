import { useEffect, useMemo, useState } from 'react';
import { getSeparator } from '@/lib/numbers';

export const useLocaleSeparators = () => {
  const [locale, setLocale] = useState(navigator.language || 'en-US');

  useEffect(() => {
    const handler = () => setLocale(navigator.language || 'en-US');
    globalThis.addEventListener('languagechange', handler);
    return () => globalThis.removeEventListener('languagechange', handler);
  }, []);

  return useMemo(() => {
    return {
      group: getSeparator({ locale, separatorType: 'group' }),
      decimal: getSeparator({ locale, separatorType: 'decimal' }),
    };
  }, [locale]);
};
