import type { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { AppTheme, AppThemeSetting, AppThemeSystemSetting } from './configs';

export const getAppThemeSetting = (state: RootState): AppThemeSetting =>
  state.configs.appThemeSetting;

export const getAppTheme = (state: RootState): AppTheme => {
  switch (state.configs.appThemeSetting) {
    case AppThemeSystemSetting.System:
      return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
        ? AppTheme.Dark
        : AppTheme.Light;
    default:
      return state.configs.appThemeSetting;
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

export const getAppColorMode = (state: RootState) => state.configs.appColorMode;

export const getFeeTiers = createAppSelector([(state: RootState) => state.configs.feeTiers], (t) =>
  t?.toArray()
);

export const getStatefulOrderEquityTiers = createAppSelector(
  [(state: RootState) => state.configs.equityTiers?.statefulOrderEquityTiers],
  (t) => t?.toArray()
);

export const getHasSeenLaunchIncentives = (state: RootState) =>
  state.configs.hasSeenLaunchIncentives;

export const getDefaultToAllMarketsInPositionsOrdersFills = (state: RootState) =>
  state.configs.defaultToAllMarketsInPositionsOrdersFills;
