import { BonsaiCore } from '@/bonsai/ontology';
// eslint-disable-next-line no-restricted-imports
import { useIndexerClient } from '@/bonsai/rest/lib/useIndexer';
import { useQuery } from '@tanstack/react-query';

import { IndexerPerpetualMarketStatus } from '@/types/indexer/indexerApiGen';

import { store } from '@/state/_store';

// conservative, fast way to tell if a market is real and open for trading
// using because v4_markets takes 1.1s and this is only .3s
export const useIsMarketValidFast = (market: string | undefined) => {
  const indexer = useIndexerClient();
  const { data } = useQuery({
    queryKey: ['indexer', 'market', market, indexer.key],
    queryFn: async (): Promise<boolean> => {
      if (market == null) {
        return false;
      }
      const all = BonsaiCore.markets.markets.data(store.getState());
      if (all != null) {
        return all[market]?.oraclePrice != null;
      }
      const loaded = (await indexer.indexerClient?.markets.getPerpetualMarkets(market))?.markets[
        market
      ];
      return loaded?.oraclePrice != null && loaded.status === IndexerPerpetualMarketStatus.ACTIVE;
    },
  });
  return data;
};
