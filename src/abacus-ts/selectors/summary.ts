import { createAppSelector } from '@/state/appTypes';

import { createMarketSummary } from '../calculators/markets';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import { selectAllAssetsInfo } from './assets';
import { selectRawAssets, selectRawMarkets } from './base';
import { selectAllMarketsInfo, selectSparkLinesData } from './markets';

export const selectAllMarketSummariesLoading = createAppSelector(
  [selectRawMarkets, selectRawAssets],
  mergeLoadableStatus
);

export const selectAllMarketSummaries = createAppSelector(
  [selectAllMarketsInfo, selectSparkLinesData, selectAllAssetsInfo],
  (markets, sparklines, assetInfo) => createMarketSummary(markets, sparklines, assetInfo)
);
