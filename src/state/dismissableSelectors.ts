import { type RootState } from './_store';

export const gethasSeenPredictionMarketIntoDialog = (state: RootState) =>
  state.dismissable.hasSeenPredictionMarketIntoDialog;
