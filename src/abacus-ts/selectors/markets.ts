import { createAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { calculateAllMarkets, formatSparklineData } from '../calculators/markets';
import { calculateOrderbook } from '../calculators/orderbook';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import {
  selectRawMarketsData,
  selectRawOrderbooks,
  selectRawSparklines,
  selectRawSparklinesData,
} from './base';

export const selectAllMarketsInfo = createAppSelector([selectRawMarketsData], (markets) =>
  calculateAllMarkets(markets)
);

export const selectSparklinesLoading = createAppSelector(
  [selectRawSparklines],
  mergeLoadableStatus
);

export const selectSparkLinesData = createAppSelector([selectRawSparklinesData], (sparklines) =>
  formatSparklineData(sparklines)
);

export const selectCurrentMarketOrderbookLoading = createAppSelector(
  [selectRawOrderbooks, getCurrentMarketId],
  (rawOrderbooks, currentMarketId) =>
    currentMarketId && rawOrderbooks[currentMarketId]
      ? mergeLoadableStatus(rawOrderbooks[currentMarketId])
      : 'pending'
);

export const selectCurrentMarketOrderbook = createAppSelector(
  [selectRawOrderbooks, getCurrentMarketId, (_s, groupingMultiplier: number) => groupingMultiplier],
  (rawOrderbooks, currentMarketId, groupingMultiplier) => {
    if (!currentMarketId || !rawOrderbooks[currentMarketId]?.data) {
      return undefined;
    }

    return calculateOrderbook(rawOrderbooks[currentMarketId].data, groupingMultiplier);
  }
);
