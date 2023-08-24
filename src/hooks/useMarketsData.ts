import { useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import { MarketFilters, MARKET_FILTER_LABELS, type MarketData } from '@/constants/markets';

import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

const filterFunctions = {
  [MarketFilters.ALL]: (market: MarketData) => true,
  [MarketFilters.LAYER_1]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Layer 1');
  },
  [MarketFilters.DEFI]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Defi');
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

  const markets = useMemo(() => {
    return Object.values(allPerpetualMarkets)
      .filter(Boolean)
      .map((marketData) => ({
        asset: allAssets[marketData.assetId],
        tickSizeDecimals: marketData.configs?.tickSizeDecimals,
        ...marketData,
        ...marketData.perpetual,
        ...marketData.configs,
      })) as MarketData[];
  }, [allPerpetualMarkets, allAssets]);

  const filteredMarkets = useMemo(() => {
    const filtered = markets.filter(filterFunctions[filter]);

    if (searchFilter) {
      return filtered.filter(
        ({ asset }) =>
          asset.name?.toLocaleLowerCase().includes(searchFilter.toLowerCase()) ||
          asset.symbol?.toLocaleLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    return filtered;
  }, [markets, searchFilter, filter]);

  const marketFilters = useMemo(
    () => [
      MarketFilters.ALL,
      ...Object.keys(MARKET_FILTER_LABELS).filter((marketFilter) =>
        markets.some((market) => market.asset?.tags?.toArray().some((tag) => tag === marketFilter))
      ),
    ],
    [markets]
  );

  return { marketFilters, filteredMarkets, markets };
};
