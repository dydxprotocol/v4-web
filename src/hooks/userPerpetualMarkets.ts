import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { useDydxClient } from './useDydxClient';

export const usePerpetualMarkets = () => {
  const { requestAllPerpetualMarkets } = useDydxClient();

  const perpetualMarketsFetch = useQuery({
    queryKey: ['requestAllPerpetualMarkets'],
    queryFn: requestAllPerpetualMarkets,
    refetchInterval: timeUnits.minute,
    staleTime: timeUnits.minute,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return perpetualMarketsFetch;
};
