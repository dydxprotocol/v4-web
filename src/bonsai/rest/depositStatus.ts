import { useQuery } from '@tanstack/react-query';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { timeUnits } from '@/constants/time';

import { useAccounts } from '@/hooks/useAccounts';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { Loadable } from '../lib/loadable';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export type DepositStatusResponse = {
  address: string;
  deposits: {
    results: {
      id: string;
      transaction_hash: string;
      chain_id: string;
      amount: string;
      created_at: Date;
      from_address: string;
    }[];
    total: number;
  };
};

export const useDepositStatus = (): Loadable<DepositStatusResponse | undefined> => {
  const { dydxAddress } = useAccounts();
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const indexerUrl = ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.indexers[0]!.api;

  const depositStatusQuery = useQuery({
    enabled: Boolean(dydxAddress) && Boolean(indexerUrl),
    queryKey: ['depositStatus', dydxAddress],
    queryFn: async (): Promise<DepositStatusResponse | undefined> => {
      if (!dydxAddress || !indexerUrl) {
        return undefined;
      }

      try {
        const response = await fetch(`${indexerUrl}/v4/bridging/getDeposits/${dydxAddress}`, {
          method: 'GET',
        });

        if (!response.ok) {
          // If 404 or endpoint doesn't exist, return empty deposits
          if (response.status === 404) {
            return { address: dydxAddress, deposits: { results: [], total: 0 } };
          }
          throw new Error(`Failed to fetch deposit status: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        // Gracefully handle errors - return empty deposits
        return { address: dydxAddress, deposits: { results: [], total: 0 } };
      }
    },
    refetchInterval: 10 * timeUnits.second, // Poll every 8 seconds
    staleTime: 5 * timeUnits.second,
  });

  return queryResultToLoadable(depositStatusQuery);
};
