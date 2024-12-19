import { RootState } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { calculateAllMarkets } from '../calculators/markets';
import { selectRawMarketsData } from './base';

export const selectAllMarketsInfo = createAppSelector([selectRawMarketsData], (markets) =>
  calculateAllMarkets(markets)
);

export const selectCurrentMarketInfo = createAppSelector(
  [selectAllMarketsInfo, (state: RootState) => state.perpetuals.currentMarketId],
  (markets, currentMarketId) => (currentMarketId ? markets?.[currentMarketId] : undefined)
);
