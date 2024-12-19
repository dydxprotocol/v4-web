import { RootState } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { calculateAllMarkets } from '../calculators/markets';
import { selectRawMarketsData } from './base';

export const createSelectAllMarketsInfo = createAppSelector([selectRawMarketsData], (markets) =>
  calculateAllMarkets(markets)
);

export const createSelectCurrentMarketInfo = createAppSelector(
  [createSelectAllMarketsInfo, (state: RootState) => state.perpetuals.currentMarketId],
  (markets, currentMarketId) => (currentMarketId ? markets?.[currentMarketId] : undefined)
);
