import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { SUPPORTED_BASE_TAGS_LOCALE_MAPPING } from '@/constants/localization';

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
  const selectedLocale = useSelector(getSelectedLocale);
  const [browserLanguage, setBrowserLanguage] = useState(navigator.language || 'en-US');

  useEffect(() => {
    const handler = () => setBrowserLanguage(navigator.language || 'en-US');
    globalThis.addEventListener('languagechange', handler);
    return () => globalThis.removeEventListener('languagechange', handler);
  }, []);

  useEffect(() => {
    if (selectedLocale) {
      const updatedBrowserLanguage = Object.entries(SUPPORTED_BASE_TAGS_LOCALE_MAPPING).find(
        ([, value]) => value === selectedLocale
      );

      if (updatedBrowserLanguage) {
        setBrowserLanguage(selectedLocale);
      }
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
