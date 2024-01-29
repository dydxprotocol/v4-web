import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { kollections } from '@dydxprotocol/v4-abacus';

import type { Configs, FeeDiscount, FeeTier, NetworkConfigs, Nullable } from '@/constants/abacus';
import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';

export enum AppTheme {
  Classic = 'Classic',
  Dark = 'Dark',
  Light = 'Light',
}

export enum AppColorMode {
  GreenUp = 'GreenUp',
  RedUp = 'RedUp',
}

export interface ConfigsState {
  appTheme: AppTheme;
  appColorMode: AppColorMode;
  feeTiers?: kollections.List<FeeTier>;
  feeDiscounts?: FeeDiscount[];
  network?: NetworkConfigs;
  hasSeenLaunchIncentives: boolean;
}

const DOCUMENT_THEME_MAP = {
  [AppTheme.Classic]: () => {
    document?.documentElement?.classList.remove('theme-dark', 'theme-light');
  },
  [AppTheme.Dark]: () => {
    document?.documentElement?.classList.remove('theme-light');
    document?.documentElement?.classList.add('theme-dark');
  },
  [AppTheme.Light]: () => {
    document?.documentElement?.classList.remove('theme-dark');
    document?.documentElement?.classList.add('theme-light');
  },
};

export const changeTheme = (theme: AppTheme) => DOCUMENT_THEME_MAP[theme]();

const initialState: ConfigsState = {
  appTheme: getLocalStorage({
    key: LocalStorageKey.SelectedTheme,
    defaultValue: AppTheme.Classic,
  }),
  appColorMode: getLocalStorage({
    key: LocalStorageKey.SelectedColorMode,
    defaultValue: AppColorMode.GreenUp,
  }),
  feeDiscounts: undefined,
  feeTiers: undefined,
  network: undefined,
  hasSeenLaunchIncentives: getLocalStorage({
    key: LocalStorageKey.HasSeenLaunchIncentives,
    defaultValue: false,
  }),
};

changeTheme(initialState.appTheme);

export const configsSlice = createSlice({
  name: 'Inputs',
  initialState,
  reducers: {
    setAppTheme: (state: ConfigsState, { payload }: PayloadAction<AppTheme>) => {
      setLocalStorage({ key: LocalStorageKey.SelectedTheme, value: payload });
      changeTheme(payload);
      state.appTheme = payload;
    },
    setAppColorMode: (state: ConfigsState, { payload }: PayloadAction<AppColorMode>) => {
      setLocalStorage({ key: LocalStorageKey.SelectedColorMode, value: payload });
      state.appColorMode = payload;
    },
    setConfigs: (state: ConfigsState, action: PayloadAction<Nullable<Configs>>) => ({
      ...state,
      ...action.payload,
    }),
    markLaunchIncentivesSeen: (state: ConfigsState) => {
      setLocalStorage({ key: LocalStorageKey.HasSeenLaunchIncentives, value: true });
      state.hasSeenLaunchIncentives = true;
    },
  },
});

export const { setAppTheme, setAppColorMode, setConfigs, markLaunchIncentivesSeen } =
  configsSlice.actions;
