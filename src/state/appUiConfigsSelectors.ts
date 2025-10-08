import type { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { AppTheme, AppThemeSetting, AppThemeSystemSetting } from './appUiConfigs';

export const getAppThemeSetting = (state: RootState): AppThemeSetting =>
  state.appUiConfigs.appThemeSetting;

export const getAppTheme = (state: RootState): AppTheme => {
  switch (state.appUiConfigs.appThemeSetting) {
    case AppThemeSystemSetting.System:
      return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
        ? AppTheme.Dark
        : AppTheme.Light;
    default:
      return state.appUiConfigs.appThemeSetting;
  }
};

const ChartDotBackgrounds = {
  [AppTheme.Dark]: '/chart-dots-background-dark.svg',
  [AppTheme.Classic]: '/chart-dots-background-dark.svg',
  [AppTheme.Light]: '/chart-dots-background-light.svg',
};

const GridBackgrounds = {
  [AppTheme.Dark]: '/grid-background-dark.svg',
  [AppTheme.Classic]: '/grid-background-dark.svg',
  [AppTheme.Light]: '/grid-background-light.svg',
};

export const getChartDotBackground = (state: RootState): string => {
  const appTheme = getAppTheme(state);
  return ChartDotBackgrounds[appTheme];
};

export const getGridBackground = (state: RootState): string => {
  const appTheme = getAppTheme(state);
  return GridBackgrounds[appTheme];
};

export const getAppColorMode = (state: RootState) => state.appUiConfigs.appColorMode;

export const getHasSeenLaunchIncentives = (state: RootState) =>
  state.appUiConfigs.hasSeenLaunchIncentives;

export const getDefaultToAllMarketsInPositionsOrdersFills = (state: RootState) =>
  state.appUiConfigs.defaultToAllMarketsInPositionsOrdersFills;

export const getSelectedDisplayUnit = (state: RootState) => state.appUiConfigs.displayUnit;

export const getShouldHideLaunchableMarkets = (state: RootState) =>
  state.appUiConfigs.shouldHideLaunchableMarkets;

export const getFavoritedMarkets = (state: RootState) => state.appUiConfigs.favoritedMarkets;
export const getSpotFavorites = (state: RootState) => state.appUiConfigs.spotFavorites;

export const getHorizontalPanelHeightPx = (state: RootState) =>
  state.appUiConfigs.horizontalPanelHeightPx;

export const getIsMarketFavorited = createAppSelector(
  [getFavoritedMarkets, (s: RootState, marketId: string) => marketId],
  (favoritedMarkets, marketId) => favoritedMarkets.includes(marketId)
);

export const getIsSpotTokenFavorited = createAppSelector(
  [getSpotFavorites, (_, tokenAddress: string) => tokenAddress],
  (favorited, tokenAddress) => favorited.includes(tokenAddress)
);

export const getSavedTablePageSize = createAppSelector(
  [(state) => state.appUiConfigs.tablePageSizes, (_s, id: string) => id],
  (pageSizes, id) => pageSizes[id]
);

// Simple UI
export const getSimpleUISortMarketsBy = (state: RootState) =>
  state.appUiConfigs.simpleUI.sortMarketsBy;

export const getSimpleUISortPositionsBy = (state: RootState) =>
  state.appUiConfigs.simpleUI.sortPositionsBy;
