import { useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { AssetData } from '@/bonsai/types/summaryTypes';
import { shallowEqual } from 'react-redux';

import {
  HiddenMarketFilterTags,
  MARKET_FILTER_OPTIONS,
  MarketFilters,
  type MarketData,
} from '@/constants/markets';

import { useAppSelector } from '@/state/appTypes';
import { getFavoritedMarkets, getShouldHideLaunchableMarkets } from '@/state/appUiConfigsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import {
  getMarketDataFromAsset,
  getMarketDataFromPerpetualMarketSummary,
} from '@/lib/marketsHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { objectKeys } from '@/lib/objectHelpers';
import { matchesSearchFilter } from '@/lib/search';
import { orEmptyObj } from '@/lib/typeUtils';

const filterFunctions: Record<MarketFilters, (market: MarketData) => boolean | undefined> = {
  [MarketFilters.AI]: (market) => {
    return market.sectorTags?.includes(MarketFilters.AI);
  },
  [MarketFilters.ALL]: () => true,
  [MarketFilters.DEFI]: (market) => {
    return (
      !!market.sectorTags?.includes(MarketFilters.DEFI) ||
      !!market.sectorTags?.includes(HiddenMarketFilterTags.DEX)
    );
  },
  [MarketFilters.DEPIN]: (market) => {
    return market.sectorTags?.includes(MarketFilters.DEPIN);
  },
  [MarketFilters.FAVORITE]: (market) => {
    return market.isFavorite;
  },
  [MarketFilters.FX]: (market) => {
    return market.sectorTags?.includes(MarketFilters.FX);
  },
  [MarketFilters.GAMING]: (market) => {
    return market.sectorTags?.includes(MarketFilters.GAMING);
  },
  [MarketFilters.LAYER_1]: (market) => {
    return market.sectorTags?.includes(MarketFilters.LAYER_1);
  },
  [MarketFilters.LAYER_2]: (market) => {
    return market.sectorTags?.includes(MarketFilters.LAYER_2);
  },
  [MarketFilters.MEMES]: (market) => {
    return market.sectorTags?.includes(MarketFilters.MEMES);
  },
  [MarketFilters.NEW]: (market) => {
    return market.isNew;
  },
  [MarketFilters.PREDICTION_MARKET]: (market) => {
    return market.sectorTags?.includes(MarketFilters.PREDICTION_MARKET);
  },
  [MarketFilters.RWA]: (market) => {
    return market.sectorTags?.includes(MarketFilters.RWA);
  },
  [MarketFilters.LAUNCHABLE]: (market) => {
    return market.isUnlaunched;
  },
};

const sortByMarketCap = (a: AssetData, b: AssetData) => {
  return (b.marketCap ?? 0) - (a.marketCap ?? 0);
};

const ASSETS_TO_REMOVE = new Set(['USDC', 'USDT']);
export const useMarketsData = ({
  filter = MarketFilters.ALL,
  searchFilter,
  forceHideUnlaunchedMarkets,
  forceShowUnlaunchedMarkets,
}: {
  filter: MarketFilters;
  searchFilter?: string;
  forceHideUnlaunchedMarkets?: boolean;
  forceShowUnlaunchedMarkets?: boolean;
}): {
  markets: MarketData[];
  filteredMarkets: MarketData[];
  marketFilters: MarketFilters[];
  hasMarketIds: boolean;
  hasResults: boolean;
} => {
  const perpetualMarkets = orEmptyObj(useAppSelector(BonsaiCore.markets.markets.data));
  const assets = orEmptyObj(useAppSelector(BonsaiCore.markets.assets.data));

  const shouldHideLaunchableMarkets =
    useAppSelector(getShouldHideLaunchableMarkets) || forceHideUnlaunchedMarkets;
  const favoritedMarkets = useAppSelector(getFavoritedMarkets, shallowEqual);
  const hasMarketIds = Object.keys(perpetualMarkets).length > 0;

  // AssetIds from existing PerpetualMarkets
  const marketsAssetIdSet = useMemo(
    () =>
      new Set(
        Object.values(perpetualMarkets)
          .filter(isTruthy)
          .map((m) => m.assetId)
      ),
    [perpetualMarkets]
  );

  const markets: MarketData[] = useMemo(() => {
    const listOfMarkets = Object.values(perpetualMarkets)
      .filter(isTruthy)
      // filter out markets that cannot be traded
      .filter((m) => m.status !== 'FINAL_SETTLEMENT')
      // temporarily filter out markets with empty/0 oracle price
      .filter((m) => MustBigNumber(m.oraclePrice).gt(0))
      .map(getMarketDataFromPerpetualMarketSummary);

    const unlaunchedMarketsData =
      !!forceShowUnlaunchedMarkets || !shouldHideLaunchableMarkets
        ? Object.values(assets)
            .filter(isTruthy)
            .filter((a) => !ASSETS_TO_REMOVE.has(a.assetId))
            .sort(sortByMarketCap)
            .map((asset) => {
              // Remove assets that are already in the list of markets from Indexer a long with assets that have no price or a negative price
              if (marketsAssetIdSet.has(asset.assetId) || MustBigNumber(asset.price).lte(0)) {
                return null;
              }

              return getMarketDataFromAsset(asset, favoritedMarkets);
            })
            .filter(isTruthy)
        : [];

    return [...listOfMarkets, ...unlaunchedMarketsData];
  }, [
    perpetualMarkets,
    marketsAssetIdSet,
    assets,
    favoritedMarkets,
    shouldHideLaunchableMarkets,
    forceShowUnlaunchedMarkets,
  ]);

  const filteredMarkets = useMemo(() => {
    const filtered = markets.filter(filterFunctions[filter]);

    if (searchFilter) {
      return filtered.filter(
        ({ assetId, id, name }) =>
          matchesSearchFilter(searchFilter, name) ||
          matchesSearchFilter(searchFilter, assetId) ||
          matchesSearchFilter(searchFilter, id)
      );
    }
    return filtered;
  }, [markets, searchFilter, filter]);

  const marketFilters = useMemo(
    () => [
      ...objectKeys(MARKET_FILTER_OPTIONS).filter((marketFilter) =>
        markets.some((market) => filterFunctions[marketFilter](market))
      ),
    ],
    [markets]
  );

  return {
    marketFilters,
    filteredMarkets,
    hasMarketIds,
    markets,
    hasResults: filteredMarkets.length > 0,
  };
};
