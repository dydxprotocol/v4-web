import { useEffect } from 'react';

import { appQueryClient } from '@/state/appQueryClient';

import { testFlags } from '@/lib/testFlags';

import { useSkipClient } from './transfers/skipClient';
import { assetsQueryFn, chainsQueryFn } from './transfers/useTransfers';

export const usePrefetchedQueries = () => {
  const { skipClient } = useSkipClient();
  useEffect(() => {
    if (!testFlags.showNewDepositFlow) return;

    appQueryClient.prefetchQuery({
      queryKey: ['transferEligibleChains'],
      queryFn: () => chainsQueryFn(skipClient),
    });
    appQueryClient.prefetchQuery({
      queryKey: ['transferEligibleAssets'],
      queryFn: () => assetsQueryFn(skipClient),
    });
  }, [skipClient]);
};
