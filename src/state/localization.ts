import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { LocaleData, SupportedLocales } from '@/constants/localization';

import enLocaleData from '@/localization/en';

export interface LocalizationState {
  isLocaleLoaded: boolean;
  localeData: LocaleData;
  selectedLocale: SupportedLocales;
}

const initialState: LocalizationState = {
  isLocaleLoaded: false,
  localeData: enLocaleData,
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
