import type { RootState } from './_store';

export const getSpotTrades = (state: RootState) => state.spotTrades.trades;
