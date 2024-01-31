import type { RootState } from './_store';
import { AppTheme, AppThemeSystemSetting, AppThemeSetting } from './configs';

export const getAppThemeSetting = (state: RootState): AppThemeSetting => state.configs.appTheme;

export const getAppTheme = (state: RootState): AppTheme => {
  switch (state.configs.appTheme) {
    case AppThemeSystemSetting.System:
      return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
        ? AppTheme.Dark
        : AppTheme.Light;
    default:
      return state.configs.appTheme;
  }
};

export const getAppColorMode = (state: RootState) => state.configs.appColorMode;

export const getFeeTiers = (state: RootState) => state.configs.feeTiers?.toArray();

export const getFeeDiscounts = (state: RootState) => state.configs.feeDiscounts;

export const getHasSeenLaunchIncentives = (state: RootState) =>
  state.configs.hasSeenLaunchIncentives;
