import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import {
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

import { isTruthy } from '@/lib/isTruthy';
import { objectKeys, safeAssign } from '@/lib/objectHelpers';
import { matchesSearchFilter } from '@/lib/search';
import { orEmptyRecord } from '@/lib/typeUtils';

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

  // Soon to be deprecated filters
  [MarketFilters.AI_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.AI_DEPRECATED);
  },
  [MarketFilters.DEFI_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.DEFI_DEPRECATED);
  },
  [MarketFilters.ENT_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.ENT_DEPRECATED);
  },
  [MarketFilters.FX_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.FX_DEPRECATED);
  },
  [MarketFilters.GAMING_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.GAMING_DEPRECATED);
  },
  [MarketFilters.LAYER_1_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.LAYER_1_DEPRECATED);
  },
  [MarketFilters.LAYER_2_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.LAYER_2_DEPRECATED);
  },
  [MarketFilters.MEME_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.MEME_DEPRECATED);
  },
  [MarketFilters.NFT_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.NFT_DEPRECATED);
  },
  [MarketFilters.RWA_DEPRECATED]: (market: MarketData) => {
    return market.tags?.includes(MarketFilters.RWA_DEPRECATED);
  },
};

export const useMarketsData = (
  filter: MarketFilters = MarketFilters.ALL,
  searchFilter?: string
): {
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

    return listOfMarkets;
  }, [allPerpetualClobIds, allPerpetualMarkets, allAssets, sevenDaysSparklineData]);

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
