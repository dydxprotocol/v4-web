import { useQuery } from 'react-query';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useMemo } from 'react';
import type { PerpetualMarketResponse } from '@/constants/indexer';

export const useNextClobPairId = () => {
  const { isConnected, requestAllPerpetualMarkets } = useDydxClient();

  const {
    data: perpetualMarkets,
    status,
    isFetched,
    isFetching,
    isLoading,
    isError,
  } = useQuery({
    enabled: isConnected,
    queryKey: 'PERPETUAL_MARKETS_QUERY',
    queryFn: requestAllPerpetualMarkets,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const nextAvailableClobPairId = useMemo(() => {
    if (perpetualMarkets && Object.values(perpetualMarkets).length > 0) {
      const clobPairIds = Object.values(perpetualMarkets)?.map((perpetualMarket) =>
        Number((perpetualMarket as PerpetualMarketResponse).clobPairId)
      );
      const nextAvailableClobPairId = Math.max(...clobPairIds) + 1;
      return nextAvailableClobPairId;
    }

    return undefined;
  }, [perpetualMarkets]);

  console.log(perpetualMarkets, nextAvailableClobPairId);

  return nextAvailableClobPairId;
};
