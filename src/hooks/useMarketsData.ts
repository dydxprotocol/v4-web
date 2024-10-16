import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import {
  LIQUIDITY_TIERS,
  MARKET_FILTER_OPTIONS,
  MarketFilters,
  PREDICTION_MARKET,
  type MarketData,
} from '@/constants/markets';
import { StatsigFlags } from '@/constants/statsig';

import {
  SEVEN_DAY_SPARKLINE_ENTRIES,
  usePerpetualMarketSparklines,
} from '@/hooks/usePerpetualMarketSparklines';

import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets, getPerpetualMarketsClobIds } from '@/state/perpetualsSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { isTruthy } from '@/lib/isTruthy';
import { objectKeys, safeAssign } from '@/lib/objectHelpers';
import { matchesSearchFilter } from '@/lib/search';
import { orEmptyRecord } from '@/lib/typeUtils';

import { useMetadataService } from './useLaunchableMarkets';
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
    return Object.values(PREDICTION_MARKET).includes(market.id);
  },
  [MarketFilters.RWA]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.RWA);
  },
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
} => {
  const allPerpetualMarkets = orEmptyRecord(useAppSelector(getPerpetualMarkets, shallowEqual));
  const allPerpetualClobIds = orEmptyRecord(
    useAppSelector(getPerpetualMarketsClobIds, shallowEqual)
  );
  const allAssets = orEmptyRecord(useAppSelector(getAssets, shallowEqual));
  const sevenDaysSparklineData = usePerpetualMarketSparklines();
  const featureFlags = useAllStatsigGateValues();
  const unlaunchedMarkets = useMetadataService();

  const markets = useMemo(() => {
    const listOfMarkets = Object.values(allPerpetualMarkets)
      .filter(isTruthy)
      // temporary filterout TRUMPWIN until the backend is working
      .filter(
        (m) => m.assetId !== 'TRUMPWIN' || featureFlags?.[StatsigFlags.ffShowPredictionMarketsUi]
      )
      .map((marketData): MarketData => {
        const sevenDaySparklineEntries = sevenDaysSparklineData?.[marketData.id]?.length ?? 0;
        const isNew = Boolean(
          sevenDaysSparklineData && sevenDaySparklineEntries < SEVEN_DAY_SPARKLINE_ENTRIES
        );
        const clobPairId = allPerpetualClobIds?.[marketData.id] ?? 0;
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
          perpetual ?? {};
        const { name, tags } = allAssets[assetId] ?? {};
        const { effectiveInitialMarginFraction, initialMarginFraction, tickSizeDecimals } =
          configs ?? {};

        return safeAssign(
          {},
          {
            id,
            assetId,
            displayId,
            clobPairId,
            effectiveInitialMarginFraction,
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
          }
        );
      });

    if (unlaunchedMarkets.data && !hideUnlaunchedMarkets) {
      const unlaunchedMarketsData = Object.values(unlaunchedMarkets.data).map((market) => {
        const { id, name, sectorTags, price, percentChange24h, tickSizeDecimals } = market;

        if (listOfMarkets.some((m) => m.assetId === id)) return null;

        return safeAssign(
          {},
          {
            id: `${id}-USD`,
            assetId: id,
            displayId: getDisplayableAssetFromBaseAsset(id),
            clobPairId: -1,
            effectiveInitialMarginFraction: LIQUIDITY_TIERS[4].initialMarginFraction,
            initialMarginFraction: LIQUIDITY_TIERS[4].initialMarginFraction,
            isNew: false,
            isUnlaunched: true,
            line: undefined,
            name,
            nextFundingRate: undefined,
            openInterest: undefined,
            openInterestUSDC: undefined,
            oraclePrice: price,
            priceChange24H: price && percentChange24h ? price * percentChange24h : undefined,
            priceChange24HPercent: percentChange24h,
            tags: sectorTags ?? [],
            tickSizeDecimals,
            trades24H: 0,
            volume24H: 0,
          }
        );
      });

      return [...listOfMarkets, ...unlaunchedMarketsData.filter(isTruthy)];
    }

    return listOfMarkets;
  }, [
    allPerpetualClobIds,
    allPerpetualMarkets,
    allAssets,
    sevenDaysSparklineData,
    unlaunchedMarkets,
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
      MarketFilters.ALL,
      MarketFilters.NEW,
      ...objectKeys(MARKET_FILTER_OPTIONS).filter((marketFilter) =>
        markets.some((market) => market.tags?.some((tag) => tag === marketFilter))
      ),
    ],
    [markets]
  );

  return { marketFilters, filteredMarkets, markets };
};
