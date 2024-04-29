import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { EN_LOCALE_DATA, LocaleData, SupportedLocales } from '@/constants/localization';

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
    ) => ({
      ...state,
      selectedLocale: action.payload.locale,
    }),
  },
});

export const { setLocaleLoaded, setLocaleData, setSelectedLocale } = localizationSlice.actions;
