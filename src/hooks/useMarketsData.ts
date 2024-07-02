import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import { MARKET_FILTER_LABELS, MarketFilters, type MarketData } from '@/constants/markets';

import {
  SEVEN_DAY_SPARKLINE_ENTRIES,
  usePerpetualMarketSparklines,
} from '@/hooks/usePerpetualMarketSparklines';

import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets, getPerpetualMarketsClobIds } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { objectKeys, safeAssign } from '@/lib/objectHelpers';
import { orEmptyObj } from '@/lib/typeUtils';

const filterFunctions = {
  [MarketFilters.ALL]: () => true,
  [MarketFilters.LAYER_1]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Layer 1');
  },
  [MarketFilters.DEFI]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Defi');
  },
  [MarketFilters.LAYER_2]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Layer 2');
  },
  [MarketFilters.NFT]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('NFT');
  },
  [MarketFilters.GAMING]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Gaming');
  },
  [MarketFilters.AI]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('AI');
  },
  [MarketFilters.MEME]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Meme');
  },
  [MarketFilters.NEW]: (market: MarketData) => {
    return market.isNew;
  },
  [MarketFilters.ENT]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('ENT');
  },
  [MarketFilters.RWA]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('RWA');
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
  const allPerpetualMarkets = orEmptyObj(useAppSelector(getPerpetualMarkets, shallowEqual));
  const allPerpetualClobIds = orEmptyObj(useAppSelector(getPerpetualMarketsClobIds, shallowEqual));
  const allAssets = orEmptyObj(useAppSelector(getAssets, shallowEqual));
  const sevenDaysSparklineData = usePerpetualMarketSparklines();

  const markets = useMemo(() => {
    return Object.values(allPerpetualMarkets)
      .filter(isTruthy)
      .map((marketData): MarketData => {
        const sevenDaySparklineEntries = sevenDaysSparklineData?.[marketData.id]?.length ?? 0;
        const isNew = Boolean(
          sevenDaysSparklineData && sevenDaySparklineEntries < SEVEN_DAY_SPARKLINE_ENTRIES
        );
        const clobPairId = allPerpetualClobIds?.[marketData.id] ?? 0;

        return safeAssign(
          {},
          {
            asset: allAssets[marketData.assetId] ?? {},
            tickSizeDecimals: marketData.configs?.tickSizeDecimals,
            isNew,
            clobPairId,
          },
          marketData,
          marketData.perpetual,
          marketData.configs
        );
      });
  }, [allPerpetualMarkets, allAssets, sevenDaysSparklineData]);

  const filteredMarkets = useMemo(() => {
    const filtered = markets.filter(filterFunctions[filter]);

    if (searchFilter) {
      return filtered.filter(
        ({ asset, id }) =>
          !!asset?.name?.toLocaleLowerCase().includes(searchFilter.toLowerCase()) ||
          !!asset?.id?.toLocaleLowerCase().includes(searchFilter.toLowerCase()) ||
          !!id?.toLocaleLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    return filtered;
  }, [markets, searchFilter, filter]);

  const marketFilters = useMemo(
    () => [
      MarketFilters.ALL,
      MarketFilters.NEW,
      ...objectKeys(MARKET_FILTER_LABELS).filter((marketFilter) =>
        markets.some((market) => market.asset?.tags?.toArray().some((tag) => tag === marketFilter))
      ),
    ],
    [markets]
  );

  return { marketFilters, filteredMarkets, markets };
};
