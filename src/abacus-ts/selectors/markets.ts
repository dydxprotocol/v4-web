import { createAppSelector } from '@/state/appTypes';

import { calculateAllMarkets } from '../calculators/markets';
import { selectRawMarketsData } from './base';

export const selectAllMarketsInfo = createAppSelector([selectRawMarketsData], (markets) =>
  calculateAllMarkets(markets)
);
