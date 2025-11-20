import { logBonsaiError } from '@/bonsai/logs';
import { selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';

import { useAccounts } from './useAccounts';
import { useDepositAddress } from './useDepositAddress';

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

export const useDepositStatus = ({ enabled }: { enabled: boolean } = { enabled: false }) => {
  const { dydxAddress } = useAccounts();
  const { depositAddresses } = useDepositAddress();
  const indexerUrl = useAppSelector(selectIndexerUrl);

  const canQueryForDepositStatus =
    enabled && !!dydxAddress && Boolean(indexerUrl) && !!depositAddresses;

  return useQuery({
    enabled: canQueryForDepositStatus,
    queryKey: ['depositStatus', dydxAddress, ...Object.values(depositAddresses ?? {})],
    queryFn: async (): Promise<DepositStatusResponse> => {
      if (!indexerUrl || !dydxAddress) {
        return { address: dydxAddress ?? '', deposits: { results: [], total: 0 } };
      }

      try {
        const response = await fetch(`${indexerUrl}/v4/bridging/getDeposits/${dydxAddress}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch deposit status: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        logBonsaiError('useDepositStatus', 'Failed to fetch automated deposits', { error });
        return { address: dydxAddress, deposits: { results: [], total: 0 } };
      }
    },
    refetchInterval: 5 * timeUnits.second, // Poll every 5 seconds
  });
};
