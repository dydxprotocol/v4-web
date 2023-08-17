import { useQuery } from 'react-query';

import { useAccounts } from '@/hooks';

import { DydxAddress } from '@/constants/wallets';

const ACCOUNT_BALANCE_POLLING_INTERVAL = 60_000;

export const usePollUSDCBalance = ({
  dydxAddress,
  interval = ACCOUNT_BALANCE_POLLING_INTERVAL,
}: {
  dydxAddress?: DydxAddress;
  interval?: number;
}) => {
  const { getAccountBalance } = useAccounts();

  const { data } = useQuery({
    enabled: dydxAddress !== undefined,
    queryKey: ['usePollUSDCBalance', { dydxAddress }],
    queryFn: async () => {
      if (!dydxAddress) return;
      return await getAccountBalance({ dydxAddress });
    },
    refetchInterval: interval,
    staleTime: interval,
  });

  return data;
};
