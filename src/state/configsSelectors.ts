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

export enum BackgroundType {
  Dots = 'Dots',
  Grid = 'Grid',
}

const BackgroundPaths = {
  [BackgroundType.Dots]: {
    [AppTheme.Dark]: '/chart-dots-background-dark.svg',
    [AppTheme.Classic]: '/chart-dots-background-dark.svg',
    [AppTheme.Light]: '/chart-dots-background-light.svg',
  },
  [BackgroundType.Grid]: {
    [AppTheme.Dark]: '/grid-background-dark.svg',
    [AppTheme.Classic]: '/grid-background-dark.svg',
    [AppTheme.Light]: '/grid-background-light.svg',
  },
};

export const getBackground =
  (state: RootState) =>
  (background: BackgroundType): string => {
    const appTheme = getAppTheme(state);
    return BackgroundPaths[background][appTheme];
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
