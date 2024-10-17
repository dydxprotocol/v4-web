import { type RootState } from './_store';

export const getHasSeenPredictionMarketIntroDialog = (state: RootState) =>
  state.dismissable.hasSeenPredictionMarketIntroDialog;

export const getDismissedAffiliateBanner = (state: RootState) =>
  state.dismissable.dismissedAffiliateBanner;
