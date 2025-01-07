import { IndexerHistoricalFundingResponse } from '@/types/indexer/indexerApiGen';
import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/perpetualsSelectors';

import { useIndexerClient } from './lib/useIndexer';

export const useCurrentMarketHistoricalFunding = () => {
  const { indexerClient } = useIndexerClient();
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);

  return useQuery({
    enabled: Boolean(currentMarketId) && Boolean(indexerClient),
    queryKey: ['historicalFunding', currentMarketId],
    queryFn: async () => {
      if (!currentMarketId) {
        throw new Error('Invalid marketId found');
      } else if (!indexerClient) {
        throw new Error('Indexer client not found');
      }

      const result: IndexerHistoricalFundingResponse =
        await indexerClient.markets.getPerpetualMarketHistoricalFunding(currentMarketId);
      return result.historicalFunding;
    },
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
    placeholderData: (prev) => prev ?? [],
  });
};
