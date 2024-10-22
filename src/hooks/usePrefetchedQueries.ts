import { useEffect } from 'react';

import { appQueryClient } from '@/state/appQueryClient';

import { useSkipClient } from './transfers/skipClient';
import { assetsQueryFn, chainsQueryFn } from './transfers/useTransfers';

export const usePrefetchedQueries = () => {
  const { skipClient, skipClientId } = useSkipClient();
  useEffect(() => {
    appQueryClient.prefetchQuery({
      queryKey: ['transferEligibleChains', skipClientId],
      queryFn: () => chainsQueryFn(skipClient),
    });
    appQueryClient.prefetchQuery({
      queryKey: ['transferEligibleAssets', skipClientId],
      queryFn: () => assetsQueryFn(skipClient),
    });
  }, [skipClient, skipClientId]);
};
