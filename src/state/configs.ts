import type { kollections } from '@dydxprotocol/v4-abacus';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  Configs,
  EquityTiers,
  FeeDiscount,
  FeeTier,
  NetworkConfigs,
  Nullable,
} from '@/constants/abacus';
import { AnalyticsEvents } from '@/constants/analytics';
import { LocalStorageKey } from '@/constants/localStorage';
import { DisplayUnit } from '@/constants/trade';

import { track } from '@/lib/analytics/analytics';
import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';
import { testFlags } from '@/lib/testFlags';

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
  ReverseLayout = 'ReverseLayout',
}

export interface ConfigsState {
  appThemeSetting: AppThemeSetting;
  appColorMode: AppColorMode;
  feeTiers?: kollections.List<FeeTier>;
  equityTiers?: EquityTiers;
  feeDiscounts?: FeeDiscount[];
  network?: NetworkConfigs;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: DisplayUnit;
}

const { uiRefresh } = testFlags;

const initialState: ConfigsState = {
  appThemeSetting: getLocalStorage({
    key: LocalStorageKey.SelectedTheme,
    defaultValue: uiRefresh ? AppTheme.Dark : AppTheme.Classic,
  }),
  appColorMode: getLocalStorage({
    key: LocalStorageKey.SelectedColorMode,
    defaultValue: AppColorMode.GreenUp,
  }),
  feeDiscounts: undefined,
  feeTiers: undefined,
  equityTiers: undefined,
  network: undefined,
  hasSeenLaunchIncentives: getLocalStorage({
    key: LocalStorageKey.HasSeenLaunchIncentives,
    defaultValue: false,
  }),
  defaultToAllMarketsInPositionsOrdersFills: getLocalStorage({
    key: LocalStorageKey.DefaultToAllMarketsInPositionsOrdersFills,
    defaultValue: true,
  }),
  displayUnit: getLocalStorage({
    key: LocalStorageKey.SelectedDisplayUnit,
    defaultValue: DisplayUnit.Asset,
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
    setDisplayUnit: (
      state: ConfigsState,
      {
        payload,
      }: PayloadAction<{
        newDisplayUnit: DisplayUnit;
        entryPoint: string;
        assetId: string;
      }>
    ) => {
      const { newDisplayUnit, entryPoint, assetId } = payload;
      setLocalStorage({ key: LocalStorageKey.SelectedDisplayUnit, value: newDisplayUnit });
      state.displayUnit = newDisplayUnit;
      track(
        AnalyticsEvents.DisplayUnitToggled({
          entryPoint,
          assetId,
          newDisplayUnit,
        })
      );
    },
  },
});

export const {
  setDefaultToAllMarketsInPositionsOrdersFills,
  setAppThemeSetting,
  setAppColorMode,
  setConfigs,
  markLaunchIncentivesSeen,
  setDisplayUnit,
} = configsSlice.actions;
