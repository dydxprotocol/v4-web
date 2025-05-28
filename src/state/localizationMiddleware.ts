import { type SupportedLocale } from '@dydxprotocol/v4-localization';
import type { PayloadAction } from '@reduxjs/toolkit';
import { mapValues } from 'lodash';

import { LocalStorageKey } from '@/constants/localStorage';
import {
  EU_LOCALES,
  LocaleData,
  SUPPORTED_LOCALE_MAP,
  SUPPORTED_LOCALES,
  SupportedLocales,
} from '@/constants/localization';

import { initializeLocalization } from '@/state/app';
import { setLocaleData, setLocaleLoaded, setSelectedLocale } from '@/state/localization';

import { calc } from '@/lib/do';
import { getBrowserLanguage } from '@/lib/language';
import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';
import { objectKeys } from '@/lib/objectHelpers';

const allLocalesPromise = calc(async () => {
  const { LOCALE_DATA, NOTIFICATIONS, TOOLTIPS } = await import('@dydxprotocol/v4-localization');
  return mapValues(
    SUPPORTED_LOCALE_MAP,
    (obj, locale) =>
      ({
        ...LOCALE_DATA[locale as SupportedLocale],
        ...NOTIFICATIONS[locale as SupportedLocale],
        TOOLTIPS: TOOLTIPS[locale as SupportedLocale],
      }) as LocaleData
  );
});

let currentSetLocaleId = 0;

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
      const { locale, isAutoDetect } = payload as ReturnType<typeof setSelectedLocale>['payload'];
      store.dispatch(setLocaleLoaded(false));

      currentSetLocaleId += 1;
      const mySetId = currentSetLocaleId;
      const allLocales = await allLocalesPromise;
      // if we got pre-empted
      if (currentSetLocaleId !== mySetId) {
        break;
      }

      store.dispatch(
        setLocaleData({
          enLocaleData: allLocales[SupportedLocales.EN],
          localeData: allLocales[locale],
        })
      );
      if (!isAutoDetect) {
        setLocalStorage({ key: LocalStorageKey.SelectedLocale, value: locale });
      }
      break;
    }
    default: {
      break;
    }
  }
};
