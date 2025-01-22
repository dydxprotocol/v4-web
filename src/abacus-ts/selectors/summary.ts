import { omit } from 'lodash';
import { shallowEqual } from 'react-redux';

import { createAppSelector } from '@/state/appTypes';
import { getFavoritedMarkets } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { createMarketSummary } from '../calculators/markets';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import { PerpetualMarketSummary } from '../types/summaryTypes';
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

export const selectCurrentMarketInfo = createAppSelector(
  [selectAllMarketSummaries, getCurrentMarketId],
  (markets, currentMarketId) => (currentMarketId ? markets?.[currentMarketId] : undefined)
);

const unstablePaths = [
  'oraclePrice',
  'priceChange24H',
  'percentChange24h',
  'nextFundingRate',
  'volume24H',
  'trades24H',
  'openInterest',
  'openInterestUSDC',
] satisfies Array<keyof PerpetualMarketSummary>;
type UnstablePaths = (typeof unstablePaths)[number];

export const selectCurrentMarketInfoStable = createAppSelector(
  [selectCurrentMarketInfo],
  (market): undefined | Omit<PerpetualMarketSummary, UnstablePaths> =>
    market == null ? market : omit(market, ...unstablePaths),
  {
    memoizeOptions: {
      resultEqualityCheck: shallowEqual,
    },
  }
);

export const selectAllMarketsInfoLoading = createAppSelector(
  [selectRawMarkets],
  mergeLoadableStatus
);

export const selectCurrentMarketAssetInfo = createAppSelector(
  [selectCurrentMarketInfo, selectAllAssetsInfo],
  (currentMarketInfo, assets) => {
    if (currentMarketInfo == null || assets == null) {
      return undefined;
    }

    return assets[currentMarketInfo.assetId];
  }
);
