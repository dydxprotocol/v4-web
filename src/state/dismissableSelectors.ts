import { type RootState } from './_store';

export const getHasSeenPredictionMarketIntroDialog = (state: RootState) =>
  state.dismissable.hasSeenPredictionMarketIntroDialog;
