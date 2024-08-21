import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { useSelectedNetwork } from './useSelectedNetwork';

type MarketMapTicker = {
  currency_pair: {
    Base: string;
    Quote: string;
  };
  decimals: string;
  min_provider_count: string;
  enabled: boolean;
  metadata_JSON?: string;
};

type MarketMapProviderConfigs = {
  name: string;
  off_chain_ticker: string;
  normalize_by_pair?: {
    Base: string;
    Quote: string;
  };
  invert: boolean;
  metadata_JSON: string;
};

export type MarketMapResponse = {
  chain_id: string;
  last_updated: string;
  market_map: {
    markets: Record<
      string,
      {
        ticker: MarketMapTicker;
        provider_configs: MarketMapProviderConfigs[];
      }
    >;
  };
};

export type HydratedMarketMap = MarketMapResponse['market_map']['markets'][string] & { id: string };

export const useMarketMap = () => {
  const { selectedNetwork } = useSelectedNetwork();

  const launchableMarkets = useQuery({
    enabled: selectedNetwork === 'dydxprotocol-staging',
    queryKey: ['launchableMarkets', selectedNetwork],
    queryFn: async () => {
      return fetch('https://validator.v4staging.dydx.exchange:1317/slinky/marketmap/v1/marketmap')
        .then((res) => res.json())
        .then((data) => data as MarketMapResponse);
    },
  });

  return launchableMarkets;
};

export const useLaunchableMarkets = () => {
  const launchableMarkets = useMarketMap();
  const marketIds = useAppSelector(getMarketIds, shallowEqual);

  const filteredPotentialMarkets: HydratedMarketMap[] = useMemo(() => {
    const marketMap = launchableMarkets.data?.market_map.markets;
    if (!marketMap) {
      return [];
    }

    return Object.entries(marketMap)
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .filter(({ id }) => {
        if (marketIds.includes(id)) {
          return false;
        }

        return true;
      });
  }, [launchableMarkets.data, marketIds]);

  return {
    ...launchableMarkets,
    data: filteredPotentialMarkets,
  };
};
