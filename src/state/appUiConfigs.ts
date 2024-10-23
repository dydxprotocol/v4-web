import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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

export interface AppUIConfigsState {
  appThemeSetting: AppThemeSetting;
  appColorMode: AppColorMode;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: DisplayUnit;
  shouldHideLaunchableMarkets: boolean;
}

const { uiRefresh } = testFlags;

const initialState: AppUIConfigsState = {
  appThemeSetting: getLocalStorage({
    key: LocalStorageKey.SelectedTheme,
    defaultValue: uiRefresh ? AppTheme.Dark : AppTheme.Classic,
  }),
  appColorMode: getLocalStorage({
    key: LocalStorageKey.SelectedColorMode,
    defaultValue: AppColorMode.GreenUp,
  }),
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
  shouldHideLaunchableMarkets: getLocalStorage({
    key: LocalStorageKey.ShouldHideLaunchableMarkets,
    defaultValue: false,
  }),
};

export const appUiConfigsSlice = createSlice({
  name: 'appUiConfigs',
  initialState,
  reducers: {
    setDefaultToAllMarketsInPositionsOrdersFills: (
      state: AppUIConfigsState,
      { payload }: PayloadAction<boolean>
    ) => {
      setLocalStorage({
        key: LocalStorageKey.DefaultToAllMarketsInPositionsOrdersFills,
        value: payload,
      });
      state.defaultToAllMarketsInPositionsOrdersFills = payload;
    },
    setAppThemeSetting: (state: AppUIConfigsState, { payload }: PayloadAction<AppThemeSetting>) => {
      setLocalStorage({ key: LocalStorageKey.SelectedTheme, value: payload });
      state.appThemeSetting = payload;
    },
    setAppColorMode: (state: AppUIConfigsState, { payload }: PayloadAction<AppColorMode>) => {
      setLocalStorage({ key: LocalStorageKey.SelectedColorMode, value: payload });
      state.appColorMode = payload;
    },
    markLaunchIncentivesSeen: (state: AppUIConfigsState) => {
      setLocalStorage({ key: LocalStorageKey.HasSeenLaunchIncentives, value: true });
      state.hasSeenLaunchIncentives = true;
    },
    setShouldHideLaunchableMarkets: (
      state: AppUIConfigsState,
      { payload }: PayloadAction<boolean>
    ) => {
      setLocalStorage({ key: LocalStorageKey.ShouldHideLaunchableMarkets, value: payload });
      state.shouldHideLaunchableMarkets = payload;
    },
    setDisplayUnit: (
      state: AppUIConfigsState,
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
  markLaunchIncentivesSeen,
  setShouldHideLaunchableMarkets,
  setDisplayUnit,
} = appUiConfigsSlice.actions;
