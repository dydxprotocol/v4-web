import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { AnalyticsEvents } from '@/constants/analytics';
import { EN_LOCALE_DATA, EU_LOCALES, LocaleData, SupportedLocales } from '@/constants/localization';

import { track } from '@/lib/analytics/analytics';

export interface LocalizationState {
  isLocaleLoaded: boolean;
  localeData: LocaleData;
  selectedLocale: SupportedLocales;
}

const initialState: LocalizationState = {
  isLocaleLoaded: false,
  localeData: EN_LOCALE_DATA,
  selectedLocale: SupportedLocales.EN,
};

export const localizationSlice = createSlice({
  name: 'Localization',
  initialState,
  reducers: {
    setLocaleLoaded: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isLocaleLoaded: action.payload,
    }),

    setLocaleData: (state, action: PayloadAction<LocaleData>) => ({
      ...state,
      localeData: action.payload,
      isLocaleLoaded: true,
    }),

    setSelectedLocale: (
      state,
      action: PayloadAction<{ locale: SupportedLocales; isAutoDetect?: boolean }>
    ) => {
      const previousLocale = state.selectedLocale;
      const newLocale = action.payload.locale;

      // regulatory: track manual switching to EU language and whether it's their browser language / switching from English
      if (
        newLocale !== previousLocale &&
        !action.payload.isAutoDetect &&
        EU_LOCALES.includes(newLocale)
      ) {
        track(
          AnalyticsEvents.SwitchedLanguageToEULanguage({
            previousLocale,
            newLocale,
            browserLanguage: globalThis.navigator?.language,
          })
        );
      }

      return {
        ...state,
        selectedLocale: newLocale,
      };
    },
  },
});

export const { setLocaleLoaded, setLocaleData, setSelectedLocale } = localizationSlice.actions;
