import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { AnalyticsEvents } from '@/constants/analytics';
import { DisplayUnit } from '@/constants/trade';

import { track } from '@/lib/analytics/analytics';
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
  favoritedMarkets: string[];
}

const { uiRefresh } = testFlags;

export const initialState: AppUIConfigsState = {
  appThemeSetting: uiRefresh ? AppTheme.Dark : AppTheme.Classic,
  appColorMode: AppColorMode.GreenUp,
  hasSeenLaunchIncentives: false,
  defaultToAllMarketsInPositionsOrdersFills: true,
  displayUnit: DisplayUnit.Asset,
  shouldHideLaunchableMarkets: false,
  favoritedMarkets: [],
};

export const appUiConfigsSlice = createSlice({
  name: 'appUiConfigs',
  initialState,
  reducers: {
    setDefaultToAllMarketsInPositionsOrdersFills: (
      state: AppUIConfigsState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.defaultToAllMarketsInPositionsOrdersFills = payload;
    },
    setAppThemeSetting: (state: AppUIConfigsState, { payload }: PayloadAction<AppThemeSetting>) => {
      state.appThemeSetting = payload;
    },
    setAppColorMode: (state: AppUIConfigsState, { payload }: PayloadAction<AppColorMode>) => {
      state.appColorMode = payload;
    },
    markLaunchIncentivesSeen: (state: AppUIConfigsState) => {
      state.hasSeenLaunchIncentives = true;
    },
    setShouldHideLaunchableMarkets: (
      state: AppUIConfigsState,
      { payload }: PayloadAction<boolean>
    ) => {
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
      state.displayUnit = newDisplayUnit;
      track(
        AnalyticsEvents.DisplayUnitToggled({
          entryPoint,
          assetId,
          newDisplayUnit,
        })
      );
    },
    favoritedMarket: (state: AppUIConfigsState, { payload: marketId }: PayloadAction<string>) => {
      const currentFavoritedMarkets = state.favoritedMarkets;
      const newFavoritedMarkets = [...currentFavoritedMarkets, marketId];
      state.favoritedMarkets = newFavoritedMarkets;
      track(AnalyticsEvents.FavoritedMarket({ marketId }));
    },
    unfavoritedMarket: (state: AppUIConfigsState, { payload: marketId }: PayloadAction<string>) => {
      const currentFavoritedMarkets = state.favoritedMarkets;
      const newFavoritedMarkets = currentFavoritedMarkets.filter((id) => id !== marketId);
      state.favoritedMarkets = newFavoritedMarkets;
      track(AnalyticsEvents.UnfavoritedMarket({ marketId }));
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
  favoritedMarket,
  unfavoritedMarket,
} = appUiConfigsSlice.actions;
