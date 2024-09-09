import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import { MARKET_FILTER_OPTIONS, MarketFilters, type MarketData } from '@/constants/markets';

import {
  SEVEN_DAY_SPARKLINE_ENTRIES,
  usePerpetualMarketSparklines,
} from '@/hooks/usePerpetualMarketSparklines';

import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets, getPerpetualMarketsClobIds } from '@/state/perpetualsSelectors';

import { getDisplayableAssetFromBaseAsset, getDisplayableTickerFromMarket } from '@/lib/assetUtils';
import { isTruthy } from '@/lib/isTruthy';
import { objectKeys, safeAssign } from '@/lib/objectHelpers';
import { matchesSearchFilter } from '@/lib/search';
import { testFlags } from '@/lib/testFlags';
import { orEmptyRecord } from '@/lib/typeUtils';

import { useLaunchableMarkets } from './useLaunchableMarkets';

const filterFunctions = {
  [MarketFilters.AI]: (market: MarketData) => {
    return market.tags?.includes('AI');
  },
  [MarketFilters.ALL]: () => true,
  [MarketFilters.DEFI]: (market: MarketData) => {
    return market.tags?.includes('Defi');
  },
  [MarketFilters.ENT]: (market: MarketData) => {
    return market.tags?.includes('ENT');
  },
  [MarketFilters.GAMING]: (market: MarketData) => {
    return market.tags?.includes('Gaming');
  },
  [MarketFilters.LAUNCHABLE]: (market: MarketData) => {
    return market.tags?.includes('Launchable');
  },
  [MarketFilters.LAYER_1]: (market: MarketData) => {
    return market.tags?.includes('Layer 1');
  },
  [MarketFilters.LAYER_2]: (market: MarketData) => {
    return market.tags?.includes('Layer 2');
  },
  [MarketFilters.MEME]: (market: MarketData) => {
    return market.tags?.includes('Meme');
  },
  [MarketFilters.NEW]: (market: MarketData) => {
    return market.isNew;
  },
  [MarketFilters.NFT]: (market: MarketData) => {
    return market.tags?.includes('NFT');
  },
  [MarketFilters.PREDICTION_MARKET]: (market: MarketData) => {
    return market.tags?.includes('Prediction Market');
  },
  [MarketFilters.RWA]: (market: MarketData) => {
    return market.tags?.includes('RWA');
  },
};

export const useMarketsData = ({
  filter = MarketFilters.ALL,
  searchFilter,
  onlyLaunchedMarkets,
}: {
  filter?: MarketFilters;
  searchFilter?: string;
  onlyLaunchedMarkets?: boolean;
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
  const launchableMarketsQuery = useLaunchableMarkets();

  const markets = useMemo(() => {
    const listOfMarkets = Object.values(allPerpetualMarkets)
      .filter(isTruthy)
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

    if (onlyLaunchedMarkets) {
      return listOfMarkets;
    }

    launchableMarketsQuery.data?.forEach((market) => {
      const toPush: MarketData = safeAssign(
        {},
        {
          id: market.id,
          assetId: getDisplayableAssetFromBaseAsset(market.ticker.currencyPair.base),
          displayId: getDisplayableTickerFromMarket(market.id),
          clobPairId: Infinity,
          effectiveInitialMarginFraction: null,
          initialMarginFraction: null,
          isNew: false,
          line: null,
          name: getDisplayableTickerFromMarket(market.id),
          nextFundingRate: null,
          openInterest: 0,
          openInterestUSDC: 0,
          oraclePrice: null,
          priceChange24H: null,
          priceChange24HPercent: null,
          tags: [MarketFilters.LAUNCHABLE],
          tickSizeDecimals: 0,
          trades24H: null,
          volume24H: 0,
        }
      );

      listOfMarkets.push(toPush);
    });

    return listOfMarkets;
  }, [
    allPerpetualClobIds,
    allPerpetualMarkets,
    allAssets,
    launchableMarketsQuery.data,
    sevenDaysSparklineData,
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
    () =>
      [
        MarketFilters.ALL,
        MarketFilters.NEW,
        testFlags.pml && MarketFilters.LAUNCHABLE,
        ...objectKeys(MARKET_FILTER_OPTIONS).filter((marketFilter) =>
          markets.some((market) =>
            market.tags?.some(
              (tag) => tag === marketFilter && ![MarketFilters.LAUNCHABLE].includes(marketFilter)
            )
          )
        ),
      ].filter(isTruthy),
    [markets]
  );

  return { marketFilters, filteredMarkets, markets };
};
