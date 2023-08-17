import type { PayloadAction } from '@reduxjs/toolkit';

import { SUPPORTED_BASE_TAGS_LOCALE_MAPPING, SupportedLocales } from '@/constants/localization';
import { LocalStorageKey } from '@/constants/localStorage';

import { initializeLocalization } from '@/state/app';
import { setLocaleData, setLocaleLoaded, setSelectedLocale } from '@/state/localization';

import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';

const getNewLocaleData = async ({
  store,
  locale,
  isAutoDetect,
}: {
  store: any;
  locale: string;
  isAutoDetect: boolean;
}) => {
  store.dispatch(setLocaleLoaded(false));

  const newLocaleData = await import(`../localization/${locale}/index.ts`);
  store.dispatch(setLocaleData(newLocaleData.default));

  if (!isAutoDetect) {
    setLocalStorage({ key: LocalStorageKey.SelectedLocale, value: locale });
  }
};

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);
  const { type, payload } = action;

  switch (type) {
    case initializeLocalization().type: {
      const localStorageLocale = getLocalStorage({
        key: LocalStorageKey.SelectedLocale,
      }) as SupportedLocales;

      if (localStorageLocale) {
        store.dispatch(setSelectedLocale({ locale: localStorageLocale }));
      } else if (globalThis.navigator?.language) {
        const browserLanguageBaseTag = globalThis.navigator.language.split('-')[0].toLowerCase();

        const locale = SUPPORTED_BASE_TAGS_LOCALE_MAPPING[
          browserLanguageBaseTag
        ] as SupportedLocales;

        if (locale) {
          store.dispatch(setSelectedLocale({ locale, isAutoDetect: true }));
        }
      }
      break;
    }
    // @ts-ignore
    case setSelectedLocale().type: {
      const { locale, isAutoDetect } = action.payload;
      getNewLocaleData({ store, locale, isAutoDetect });
      break;
    }
    default: {
      break;
    }
  }
};
