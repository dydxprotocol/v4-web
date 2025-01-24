import { createAppSelector } from '@/state/appTypes';

import { calculateAllMarkets, formatSparklineData } from '../calculators/markets';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import { selectRawMarketsData, selectRawSparklines, selectRawSparklinesData } from './base';

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
