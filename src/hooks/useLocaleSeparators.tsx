import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { SUPPORTED_LOCALES } from '@/constants/localization';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSeparator } from '@/lib/numbers';

type LocaleContextType = ReturnType<typeof useLocaleContext>;
const LocaleContext = createContext<LocaleContextType>({} as LocaleContextType);
LocaleContext.displayName = 'Locale';

export const LocaleProvider = ({ ...props }) => (
  <LocaleContext.Provider value={useLocaleContext()} {...props} />
);

const useLocaleContext = () => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const [browserLanguage, setBrowserLanguage] = useState(navigator.language || 'en-US');

  useEffect(() => {
    const handler = () => setBrowserLanguage(navigator.language || 'en-US');
    globalThis.addEventListener('languagechange', handler);
    return () => globalThis.removeEventListener('languagechange', handler);
  }, []);

  useEffect(() => {
    const updatedBrowserLanguage = SUPPORTED_LOCALES.find(
      ({ locale }) => locale === selectedLocale
    )?.browserLanguage;

    if (updatedBrowserLanguage) {
      setBrowserLanguage(updatedBrowserLanguage);
    }
  }, [selectedLocale]);

  const separators = useMemo(() => {
    return {
      group: getSeparator({ browserLanguage, separatorType: 'group' }),
      decimal: getSeparator({ browserLanguage, separatorType: 'decimal' }),
    };
  }, [browserLanguage]);

  useEffect(() => {
    abacusStateManager.setLocaleSeparators(separators);
  }, [separators]);

  return separators;
};

export const useLocaleSeparators = () => useContext(LocaleContext);
