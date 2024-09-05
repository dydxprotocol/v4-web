import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { getTickerFromMarketmapId } from '@/lib/assetUtils';

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

const MOCK_MARKETMAP_DATA = {
  chain_id: '1',
  last_updated: '2021-10-12T00:00:00Z',
  market_map: {
    markets: {
      'BAG,raydium,D8r8XTuCrUhLheWeGXSwC3G92RhASficV3YA7B2XWcLv/USD': {
        ticker: {
          currency_pair: {
            Base: 'BAG,raydium,D8r8XTuCrUhLheWeGXSwC3G92RhASficV3YA7B2XWcLv',
            Quote: 'USD',
          },
          decimals: '12',
          min_provider_count: '1',
          enabled: false,
          metadata_JSON:
            '{"reference_price":1767877746,"liquidity":205137,"aggregate_ids":[{"venue":"coinmarketcap","ID":"30088"}]}',
        },
        provider_configs: [
          {
            name: 'raydium_api',
            off_chain_ticker:
              'BAG,raydium,D8r8XTuCrUhLheWeGXSwC3G92RhASficV3YA7B2XWcLv/SOL,raydium,So11111111111111111111111111111111111111112',
            normalize_by_pair: {
              Base: 'SOL',
              Quote: 'USD',
            },
            invert: false,
            metadata_JSON:
              '{"base_token_vault":{"token_vault_address":"7eLwyCqfhxKLsKeFwcN4JdfspKK22rSC4uQHNy3zWNPB","token_decimals":9},"quote_token_vault":{"token_vault_address":"Cr7Yo8Uf5f8pzMsY3ZwgDFNx85nb3UDvPfQxuWG4acxc","token_decimals":9},"amm_info_address":"Bv7mM5TwLxsukrRrwzEc6TFAj22GAdVCcH5ViAZFNZC","open_orders_address":"Du6ZaABu8cxmCAvwoGMixZgZuw57cCQc8xE8yRenaxL4"}',
          },
        ],
      },
    },
  },
};

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
    const marketMap = (launchableMarkets.data ?? MOCK_MARKETMAP_DATA)?.market_map?.markets;
    if (!marketMap) {
      return [];
    }

    return Object.entries(marketMap)
      .map(([id, data]) => ({
        id: getTickerFromMarketmapId(id),
        ...data,
      }))
      .filter(({ id }) => {
        return !marketIds.includes(id);
      });
  }, [launchableMarkets.data, marketIds]);

  return {
    ...launchableMarkets,
    data: filteredPotentialMarkets,
  };
};
