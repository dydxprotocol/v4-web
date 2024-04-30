import { useMemo } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import { MARKET_FILTER_LABELS, MarketFilters, type MarketData } from '@/constants/markets';

import {
  SEVEN_DAY_SPARKLINE_ENTRIES,
  usePerpetualMarketSparklines,
} from '@/hooks/usePerpetualMarketSparklines';

import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';

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
};

export const useMarketsData = (
  filter: MarketFilters = MarketFilters.ALL,
  searchFilter?: string
): {
  markets: MarketData[];
  filteredMarkets: MarketData[];
  marketFilters: string[];
} => {
  const allPerpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const allAssets = useSelector(getAssets, shallowEqual) || {};
  const sparklineData = usePerpetualMarketSparklines();

  const markets = useMemo(() => {
    return Object.values(allPerpetualMarkets)
      .filter(isTruthy)
      .map((marketData) => ({
        asset: allAssets[marketData.assetId] ?? {},
        tickSizeDecimals: marketData.configs?.tickSizeDecimals,
        isNew: Boolean(
          sparklineData && sparklineData?.[marketData.id]?.length < SEVEN_DAY_SPARKLINE_ENTRIES
        ),
        ...marketData,
        ...marketData.perpetual,
        ...marketData.configs,
      })) as MarketData[];
  }, [allPerpetualMarkets, allAssets]);

  const filteredMarkets = useMemo(() => {
    const filtered = markets.filter(filterFunctions[filter]);

    if (searchFilter) {
      return filtered.filter(
        ({ asset, id }) =>
          asset?.name?.toLocaleLowerCase().includes(searchFilter.toLowerCase()) ||
          asset?.id?.toLocaleLowerCase().includes(searchFilter.toLowerCase()) ||
          id?.toLocaleLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    return filtered;
  }, [markets, searchFilter, filter]);

  const marketFilters = useMemo(
    () => [
      MarketFilters.ALL,
      MarketFilters.NEW,
      ...Object.keys(MARKET_FILTER_LABELS).filter((marketFilter) =>
        markets.some((market) => market.asset?.tags?.toArray().some((tag) => tag === marketFilter))
      ),
    ],
    [markets]
  );

  return { marketFilters, filteredMarkets, markets };
};
