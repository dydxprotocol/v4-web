import { type RootState } from './_store';

export const getHasSeenPredictionMarketIntroDialog = (state: RootState) =>
  state.dismissable.hasSeenPredictionMarketIntroDialog;

export const getDismissedAffiliateBanner = (state: RootState) =>
  state.dismissable.dismissedAffiliateBanner;

export const getHasDismissedPmlBanner = (state: RootState) =>
  state.dismissable.hasDismissedPmlBanner;

export const getHasDismissedPumpBanner = (state: RootState) =>
  state.dismissable.hasDismissedPumpBanner;

export const getHasDismissedSurgeBanner = (state: RootState) =>
  state.dismissable.hasDismissedSurgeBanner;

export const getHasDismissedRebateBanner = (state: RootState) =>
  state.dismissable.hasDismissedRebateBanner;

export const getHasDismissedTradingLeagueBanner = (state: RootState) =>
  state.dismissable.hasDismissedTradingLeagueBanner;

export const getHasDismissedNoFeeBanner = (state: RootState) =>
  state.dismissable.hasDismissedNoFeeBanner;
