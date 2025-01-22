import { createAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { calculateAllMarkets, formatSparklineData } from '../calculators/markets';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import {
  selectRawMarkets,
  selectRawMarketsData,
  selectRawSparklines,
  selectRawSparklinesData,
} from './base';

export const selectAllMarketsInfo = createAppSelector([selectRawMarketsData], (markets) =>
  calculateAllMarkets(markets)
);

export const selectCurrentMarketInfo = createAppSelector(
  [selectAllMarketsInfo, getCurrentMarketId],
  (markets, currentMarketId) => (currentMarketId ? markets?.[currentMarketId] : undefined)
);

export const selectAllMarketsInfoLoading = createAppSelector(
  [selectRawMarkets],
  mergeLoadableStatus
);

export const selectSparklinesLoading = createAppSelector(
  [selectRawSparklines],
  mergeLoadableStatus
);

export const selectSparkLinesData = createAppSelector([selectRawSparklinesData], (sparklines) =>
  formatSparklineData(sparklines)
);
