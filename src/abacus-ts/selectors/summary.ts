import { createAppSelector } from '@/state/appTypes';
import { getFavoritedMarkets } from '@/state/appUiConfigsSelectors';

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
  [selectAllMarketsInfo, selectSparkLinesData, selectAllAssetsInfo, getFavoritedMarkets],
  (markets, sparklines, assetInfo, favorites) =>
    createMarketSummary(markets, sparklines, assetInfo, favorites)
);
