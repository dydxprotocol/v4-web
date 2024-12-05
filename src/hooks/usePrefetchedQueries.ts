import { useEffect } from 'react';

import { appQueryClient } from '@/state/appQueryClient';

import { useSkipClient } from './transfers/skipClient';
import { assetsQueryFn, chainsQueryFn } from './transfers/useTransfers';

export const usePrefetchedQueries = () => {
  const { skipClient, skipInstanceId } = useSkipClient();
  useEffect(() => {
    appQueryClient.prefetchQuery({
      queryKey: ['transferEligibleChains', skipInstanceId],
      queryFn: () => chainsQueryFn(skipClient),
    });
    appQueryClient.prefetchQuery({
      queryKey: ['transferEligibleAssets', skipInstanceId],
      queryFn: () => assetsQueryFn(skipClient),
    });
  }, [skipClient, skipInstanceId]);
};
