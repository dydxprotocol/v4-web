import {
  LOCALE_DATA,
  NOTIFICATIONS,
  SupportedLocale,
  TOOLTIPS,
} from '@dydxprotocol/v4-localization';
import type { PayloadAction } from '@reduxjs/toolkit';

import { LocalStorageKey } from '@/constants/localStorage';
import {
  EU_LOCALES,
  SUPPORTED_LOCALE_MAP,
  SUPPORTED_LOCALES,
  SupportedLocales,
  type LocaleData,
} from '@/constants/localization';

import { initializeLocalization } from '@/state/app';
import { setLocaleData, setLocaleLoaded, setSelectedLocale } from '@/state/localization';

import { getBrowserLanguage } from '@/lib/language';
import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';
import { objectKeys } from '@/lib/objectHelpers';

const getNewLocaleData = ({
  store,
  locale,
  isAutoDetect,
}: {
  store: any;
  locale: SupportedLocale;
  isAutoDetect: boolean;
}) => {
  store.dispatch(setLocaleLoaded(false));

  const newLocaleData = {
    ...LOCALE_DATA[locale],
    ...NOTIFICATIONS[locale],
    TOOLTIPS: TOOLTIPS[locale],
  };

  store.dispatch(setLocaleData(newLocaleData as LocaleData));

  if (!isAutoDetect) {
    setLocalStorage({ key: LocalStorageKey.SelectedLocale, value: locale });
  }
};

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);
  const { type, payload } = action;

  switch (type) {
    case initializeLocalization().type: {
      const localStorageLocale = getLocalStorage<SupportedLocales | undefined>({
        key: LocalStorageKey.SelectedLocale,
      });

      if (localStorageLocale && objectKeys(SUPPORTED_LOCALE_MAP).includes(localStorageLocale)) {
        store.dispatch(setSelectedLocale({ locale: localStorageLocale }));
      } else {
        const browserLanguage = getBrowserLanguage();
        const browserLanguageBaseTag = browserLanguage.split('-')[0]!.toLowerCase();

        let locale =
          SUPPORTED_LOCALES.find(({ baseTag }) => baseTag === browserLanguageBaseTag)?.locale ??
          SupportedLocales.EN;

        // regulatory: do not default to browser language if it's an EU language, default to English instead
        if (EU_LOCALES.includes(locale)) {
          locale = SupportedLocales.EN;
        }

        store.dispatch(setSelectedLocale({ locale, isAutoDetect: true }));
      }

      break;
    }
    // @ts-ignore
    case setSelectedLocale().type: {
      const { locale, isAutoDetect } = payload;
      getNewLocaleData({ store, locale, isAutoDetect });
      break;
    }
    default: {
      break;
    }
  }
};
