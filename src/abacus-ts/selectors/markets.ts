import { createAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { calculateAllMarkets } from '../calculators/markets';
import { selectRawMarketsData } from './base';

export const selectAllMarketsInfo = createAppSelector([selectRawMarketsData], (markets) =>
  calculateAllMarkets(markets)
);

export const selectCurrentMarketInfo = createAppSelector(
  [selectAllMarketsInfo, getCurrentMarketId],
  (markets, currentMarketId) => (currentMarketId ? markets?.[currentMarketId] : undefined)
);
