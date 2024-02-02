import type { RootState } from './_store';

export const getAppTheme = (state: RootState) => state.configs.appTheme;

export const getAppColorMode = (state: RootState) => state.configs.appColorMode;

export const getFeeTiers = (state: RootState) => state.configs.feeTiers?.toArray();

export const getFeeDiscounts = (state: RootState) => state.configs.feeDiscounts;

export const getHasSeenLaunchIncentives = (state: RootState) =>
  state.configs.hasSeenLaunchIncentives;
