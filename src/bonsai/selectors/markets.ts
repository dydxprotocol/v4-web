import { createAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { calculateAllMarkets, formatSparklineData } from '../calculators/markets';
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

export const selectCurrentMarketOrderbook = createAppSelector(
  [selectRawOrderbooks, getCurrentMarketId],
  (rawOrderbooks, currentMarketId) => {
    if (!currentMarketId || !rawOrderbooks[currentMarketId]) {
      return undefined;
    }

    return rawOrderbooks[currentMarketId];
  }
);

export const selectCurrentMarketOrderbookLoading = createAppSelector(
  [selectCurrentMarketOrderbook],
  (currentMarketOrderbook) =>
    currentMarketOrderbook ? mergeLoadableStatus(currentMarketOrderbook) : 'idle'
);
