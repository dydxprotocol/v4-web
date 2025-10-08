import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { AnalyticsEvents } from '@/constants/analytics';
import { MarketsSortType, PositionSortType } from '@/constants/marketList';
import { DisplayUnit } from '@/constants/trade';

import { track } from '@/lib/analytics/analytics';

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

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface AppUIConfigsState {
  appThemeSetting: AppThemeSetting;
  appColorMode: AppColorMode;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: DisplayUnit;
  shouldHideLaunchableMarkets: boolean;
  favoritedMarkets: string[];
  spotFavorites: string[];
  horizontalPanelHeightPx: number;
  tablePageSizes: { [tableKey: string]: number };
  simpleUI: {
    sortMarketsBy: MarketsSortType;
    sortPositionsBy: PositionSortType;
  };
}

export const initialState: AppUIConfigsState = {
  appThemeSetting: AppTheme.Dark,
  appColorMode: AppColorMode.GreenUp,
  hasSeenLaunchIncentives: false,
  defaultToAllMarketsInPositionsOrdersFills: true,
  displayUnit: DisplayUnit.Asset,
  shouldHideLaunchableMarkets: false,
  favoritedMarkets: [],
  spotFavorites: [],
  horizontalPanelHeightPx: 288,
  tablePageSizes: {},
  simpleUI: {
    sortMarketsBy: MarketsSortType.MarketCap,
    sortPositionsBy: PositionSortType.Pnl,
  },
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
    setHorizontalPanelHeightPx: (state: AppUIConfigsState, { payload }: PayloadAction<number>) => {
      state.horizontalPanelHeightPx = payload;
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
    favoriteMarket: (state: AppUIConfigsState, { payload: marketId }: PayloadAction<string>) => {
      const currentFavoritedMarkets = state.favoritedMarkets;
      const newFavoritedMarkets = [...currentFavoritedMarkets, marketId];
      state.favoritedMarkets = newFavoritedMarkets;
    },
    unfavoriteMarket: (state: AppUIConfigsState, { payload: marketId }: PayloadAction<string>) => {
      const currentFavoritedMarkets = state.favoritedMarkets;
      const newFavoritedMarkets = currentFavoritedMarkets.filter((id) => id !== marketId);
      state.favoritedMarkets = newFavoritedMarkets;
    },
    favoriteSpotToken: (
      state: AppUIConfigsState,
      { payload: tokenAddress }: PayloadAction<string>
    ) => {
      const currentFavoritedTokens = state.spotFavorites;
      const newFavoritedTokens = [...currentFavoritedTokens, tokenAddress];
      state.spotFavorites = newFavoritedTokens;
    },
    unfavoriteSpotToken: (
      state: AppUIConfigsState,
      { payload: tokenAddress }: PayloadAction<string>
    ) => {
      state.spotFavorites = state.spotFavorites.filter((id) => id !== tokenAddress);
    },
    setTablePageSize: (
      state: AppUIConfigsState,
      { payload: { pageSize, tableId } }: PayloadAction<{ tableId: string; pageSize: number }>
    ) => {
      state.tablePageSizes[tableId] = pageSize;
    },
    setSimpleUISortMarketsBy: (
      state: AppUIConfigsState,
      { payload }: PayloadAction<MarketsSortType>
    ) => {
      state.simpleUI.sortMarketsBy = payload;
    },
    setSimpleUISortPositionsBy: (
      state: AppUIConfigsState,
      { payload }: PayloadAction<PositionSortType>
    ) => {
      state.simpleUI.sortPositionsBy = payload;
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
  favoriteMarket,
  unfavoriteMarket,
  setHorizontalPanelHeightPx,
  setTablePageSize,
  setSimpleUISortMarketsBy,
  setSimpleUISortPositionsBy,
  favoriteSpotToken,
  unfavoriteSpotToken,
} = appUiConfigsSlice.actions;
