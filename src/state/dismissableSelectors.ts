import { type RootState } from './_store';

export const getHasSeenPredictionMarketIntroDialog = (state: RootState) =>
  state.dismissable.hasSeenPredictionMarketIntroDialog;

export const getDismissedAffiliateBanner = (state: RootState) =>
  state.dismissable.dismissedAffiliateBanner;

export const getHasDismissedPmlBanner = (state: RootState) =>
  state.dismissable.hasDismissedPmlBanner;
