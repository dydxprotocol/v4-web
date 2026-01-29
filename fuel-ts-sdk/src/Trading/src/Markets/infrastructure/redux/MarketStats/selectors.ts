import type { RootState } from '@sdk/shared/lib/redux';
import { marketStatsEntityAdapter } from './types';

export const marketStatsSelectors = marketStatsEntityAdapter.getSelectors(
  (state: RootState) => state.trading.markets.marketStats
);
