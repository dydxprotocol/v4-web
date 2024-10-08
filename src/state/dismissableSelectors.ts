import { type RootState } from './_store';

export const getHasSeenPredictionMarketIntoDialog = (state: RootState) =>
  state.dismissable.hasSeenPredictionMarketIntoDialog;
