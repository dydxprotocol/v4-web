import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import { MetadataServiceAsset } from '@/constants/assetMetadata';
import {
  LIQUIDITY_TIERS,
  MARKET_FILTER_OPTIONS,
  MarketFilters,
  type MarketData,
} from '@/constants/markets';
import { StatsigFlags } from '@/constants/statsig';

import {
  SEVEN_DAY_SPARKLINE_ENTRIES,
  usePerpetualMarketSparklines,
} from '@/hooks/usePerpetualMarketSparklines';

import { useAppSelector } from '@/state/appTypes';
import { getFavoritedMarkets, getShouldHideLaunchableMarkets } from '@/state/appUiConfigsSelectors';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets, getPerpetualMarketsClobIds } from '@/state/perpetualsSelectors';

import { getDisplayableAssetFromBaseAsset, getMarketIdFromAsset } from '@/lib/assetUtils';
import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { objectKeys, safeAssign } from '@/lib/objectHelpers';
import { matchesSearchFilter } from '@/lib/search';
import { orEmptyObj, orEmptyRecord } from '@/lib/typeUtils';

import { useMetadataService } from './useMetadataService';
import { useAllStatsigGateValues } from './useStatsig';

const filterFunctions = {
  [MarketFilters.AI]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.AI);
  },
  [MarketFilters.ALL]: () => true,
  [MarketFilters.DEFI]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.DEFI);
  },
  [MarketFilters.DEPIN]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.DEPIN);
  },
  [MarketFilters.FAVORITE]: (market: MarketData) => {
    return market.isFavorite;
  },
  [MarketFilters.FX]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.FX);
  },
  [MarketFilters.GAMING]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.GAMING);
  },
  [MarketFilters.LAYER_1]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.LAYER_1);
  },
  [MarketFilters.LAYER_2]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.LAYER_2);
  },
  [MarketFilters.MEMES]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.MEMES);
  },
  [MarketFilters.NEW]: (market: MarketData) => {
    return market.isNew;
  },
  [MarketFilters.PREDICTION_MARKET]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.PREDICTION_MARKET);
  },
  [MarketFilters.RWA]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.RWA);
  },
  [MarketFilters.LAUNCHABLE]: (market: MarketData) => {
    return market.isUnlaunched;
  },
};

const sortByMarketCap = (a: MetadataServiceAsset, b: MetadataServiceAsset) => {
  return (b.marketCap ?? 0) - (a.marketCap ?? 0);
};

export const useMarketsData = ({
  filter = MarketFilters.ALL,
  searchFilter,
  hideUnlaunchedMarkets,
}: {
  filter: MarketFilters;
  searchFilter?: string;
  hideUnlaunchedMarkets?: boolean;
}): {
  markets: MarketData[];
  filteredMarkets: MarketData[];
  marketFilters: MarketFilters[];
  hasMarketIds: boolean;
  hasResults: boolean;
} => {
  const allPerpetualMarkets = orEmptyRecord(useAppSelector(getPerpetualMarkets, shallowEqual));
  const allPerpetualClobIds = orEmptyRecord(
    useAppSelector(getPerpetualMarketsClobIds, shallowEqual)
  );
  const allAssets = orEmptyRecord(useAppSelector(getAssets, shallowEqual));
  const sevenDaysSparklineData = usePerpetualMarketSparklines();
  const featureFlags = useAllStatsigGateValues();
  const metadataServiceInfo = useMetadataService();
  const shouldHideLaunchableMarkets =
    useAppSelector(getShouldHideLaunchableMarkets) || hideUnlaunchedMarkets;
  const favoritedMarkets = useAppSelector(getFavoritedMarkets, shallowEqual);
  const hasMarketIds = Object.keys(allPerpetualMarkets).length > 0;

  const allPerpetualMarketIdsSet = new Set(
    Object.values(allPerpetualMarkets)
      .filter(isTruthy)
      .map((m) => m.assetId)
  );

  const markets = useMemo(() => {
    const listOfMarkets = Object.values(allPerpetualMarkets)
      .filter(isTruthy)
      // filter out markets that cannot be traded
      .filter((m) => Boolean(m.status?.canTrade))
      // temporarily filter out markets with empty/0 oracle price
      .filter((m) => isTruthy(m.oraclePrice))
      // temporary filterout TRUMPWIN until the backend is working
      .filter(
        (m) => m.assetId !== 'TRUMPWIN' || featureFlags[StatsigFlags.ffShowPredictionMarketsUi]
      )
      .map((marketData): MarketData => {
        const sevenDaySparklineEntries = sevenDaysSparklineData?.[marketData.id]?.length ?? 0;
        const isNew = Boolean(
          sevenDaysSparklineData && sevenDaySparklineEntries < SEVEN_DAY_SPARKLINE_ENTRIES
        );
        const clobPairId = allPerpetualClobIds[marketData.id] ?? 0;
        const {
          volume24h: spotVolume24H,
          marketCap,
          reportedMarketCap,
        } = orEmptyObj(metadataServiceInfo.data[marketData.assetId]);

        const {
          assetId,
          displayId,
          id,
          configs,
          oraclePrice,
          priceChange24H,
          priceChange24HPercent,
          perpetual,
        } = marketData;
        const { nextFundingRate, line, openInterest, openInterestUSDC, trades24H, volume24H } =
          orEmptyObj(perpetual);
        const { name, tags, resources } = orEmptyObj(allAssets[assetId]);
        const { imageUrl } = orEmptyObj(resources);
        const { effectiveInitialMarginFraction, initialMarginFraction, tickSizeDecimals } =
          orEmptyObj(configs);

        return safeAssign(
          {},
          {
            id,
            assetId,
            displayId,
            clobPairId,
            effectiveInitialMarginFraction,
            imageUrl,
            initialMarginFraction,
            isNew,
            line: line?.toArray(),
            name,
            nextFundingRate,
            openInterest,
            openInterestUSDC,
            oraclePrice,
            priceChange24H,
            priceChange24HPercent,
            tags: tags?.toArray(),
            tickSizeDecimals,
            trades24H,
            volume24H,
            spotVolume24H,
            marketCap: marketCap ?? reportedMarketCap,
            isFavorite: favoritedMarkets.includes(id),
          }
        );
      });

    if (!shouldHideLaunchableMarkets) {
      const unlaunchedMarketsData = Object.values(metadataServiceInfo.data)
        .sort(sortByMarketCap)
        .map((market) => {
          const {
            id: assetId,
            name,
            logo,
            sectorTags,
            price,
            percentChange24h,
            tickSizeDecimals,
            volume24h: spotVolume24H,
            marketCap,
            reportedMarketCap,
          } = market;

          if (allPerpetualMarketIdsSet.has(assetId)) return null;

          const id = getMarketIdFromAsset(assetId);

          return safeAssign(
            {},
            {
              id,
              assetId,
              displayId: getMarketIdFromAsset(getDisplayableAssetFromBaseAsset(assetId)),
              clobPairId: -1,
              effectiveInitialMarginFraction: LIQUIDITY_TIERS[4].initialMarginFraction,
              imageUrl: logo,
              initialMarginFraction: LIQUIDITY_TIERS[4].initialMarginFraction,
              isNew: false,
              isUnlaunched: true,
              line: undefined,
              name,
              nextFundingRate: undefined,
              openInterest: undefined,
              openInterestUSDC: undefined,
              oraclePrice: price,
              priceChange24H:
                price && percentChange24h
                  ? MustBigNumber(price).times(MustBigNumber(percentChange24h).div(100)).toNumber()
                  : undefined,
              priceChange24HPercent: MustBigNumber(percentChange24h).div(100).toNumber(),
              tags: sectorTags ?? [],
              tickSizeDecimals,
              trades24H: undefined,
              volume24H: undefined,
              spotVolume24H,
              marketCap: marketCap ?? reportedMarketCap,
              isFavorite: favoritedMarkets.includes(id),
            }
          );
        });

      return [...listOfMarkets, ...unlaunchedMarketsData.filter(isTruthy)];
    }

    return listOfMarkets;
  }, [
    allPerpetualMarkets,
    shouldHideLaunchableMarkets,
    featureFlags,
    sevenDaysSparklineData,
    allPerpetualClobIds,
    allAssets,
    metadataServiceInfo.data,
    favoritedMarkets,
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
