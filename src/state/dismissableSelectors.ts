import { type RootState } from './_store';

export const getHasSeenPolymarketDialog = (state: RootState) =>
  state.dismissable.hasSeenPolymarketDialog;
