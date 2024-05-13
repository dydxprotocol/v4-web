import type { kollections } from '@dydxprotocol/v4-abacus';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Configs, FeeDiscount, FeeTier, NetworkConfigs, Nullable } from '@/constants/abacus';
import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';

export enum AppTheme {
  Classic = 'Classic',
  Dark = 'Dark',
  Light = 'Light',
}

export enum AppThemeSystemSetting {
  System = 'System',
}

export type AppThemeSetting = AppTheme | AppThemeSystemSetting;

export enum AppColorMode {
  GreenUp = 'GreenUp',
  RedUp = 'RedUp',
}

export enum OtherPreference {
  DisplayAllMarketsDefault = 'DisplayAllMarketsDefault',
  GasToken = 'GasToken',
}

export interface ConfigsState {
  appThemeSetting: AppThemeSetting;
  appColorMode: AppColorMode;
  feeTiers?: kollections.List<FeeTier>;
  feeDiscounts?: FeeDiscount[];
  network?: NetworkConfigs;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
}

const initialState: ConfigsState = {
  appThemeSetting: getLocalStorage({
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
  defaultToAllMarketsInPositionsOrdersFills: getLocalStorage({
    key: LocalStorageKey.DefaultToAllMarketsInPositionsOrdersFills,
    defaultValue: true,
  }),
};

export const configsSlice = createSlice({
  name: 'Inputs',
  initialState,
  reducers: {
    setDefaultToAllMarketsInPositionsOrdersFills: (
      state: ConfigsState,
      { payload }: PayloadAction<boolean>
    ) => {
      setLocalStorage({
        key: LocalStorageKey.DefaultToAllMarketsInPositionsOrdersFills,
        value: payload,
      });
      state.defaultToAllMarketsInPositionsOrdersFills = payload;
    },
    setAppThemeSetting: (state: ConfigsState, { payload }: PayloadAction<AppThemeSetting>) => {
      setLocalStorage({ key: LocalStorageKey.SelectedTheme, value: payload });
      state.appThemeSetting = payload;
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

export const {
  setDefaultToAllMarketsInPositionsOrdersFills,
  setAppThemeSetting,
  setAppColorMode,
  setConfigs,
  markLaunchIncentivesSeen,
} = configsSlice.actions;
