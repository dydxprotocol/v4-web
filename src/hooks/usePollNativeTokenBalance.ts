import { useQuery } from 'react-query';

import { useAccounts } from '@/hooks';

import { DydxAddress } from '@/constants/wallets';
import { DYDX_DENOM } from '@dydxprotocol/v4-client-js';

const ACCOUNT_BALANCE_POLLING_INTERVAL = 60_000;

export const usePollNativeTokenBalance = ({
  dydxAddress,
  interval = ACCOUNT_BALANCE_POLLING_INTERVAL,
}: {
  dydxAddress?: DydxAddress;
  interval?: number;
}) => {
  const { getAccountBalance } = useAccounts();

  const { data } = useQuery({
    enabled: dydxAddress !== undefined,
    queryKey: ['usePollNativeTokenBalance', { dydxAddress }],
    queryFn: async () => {
      if (!dydxAddress) return;
      return await getAccountBalance({ dydxAddress, denom: DYDX_DENOM });
    },
    refetchInterval: interval,
    staleTime: interval,
  });

  return data;
};
