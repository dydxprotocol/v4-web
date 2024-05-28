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

export const getAppColorMode = (state: RootState) => state.configs.appColorMode;

export const getFeeTiers = createAppSelector([(state: RootState) => state.configs.feeTiers], (t) =>
  t?.toArray()
);

export const getStatefulOrderEquityTiers = (state: RootState) =>
  state.configs.equityTiers?.statefulOrderEquityTiers?.toArray();

export const getHasSeenLaunchIncentives = (state: RootState) =>
  state.configs.hasSeenLaunchIncentives;

export const getDefaultToAllMarketsInPositionsOrdersFills = (state: RootState) =>
  state.configs.defaultToAllMarketsInPositionsOrdersFills;
