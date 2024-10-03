import { useQuery } from '@tanstack/react-query';

import { DydxAddress } from '@/constants/wallets';

import { log } from '@/lib/telemetry';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';

export const useReferredBy = () => {
  const { dydxAddress } = useAccounts();
  const { getReferredBy } = useDydxClient();

  const queryFn = async ({ queryKey }: { queryKey: (string | DydxAddress | undefined)[] }) => {
    const [, address] = queryKey;
    if (!address) {
      return undefined;
    }
    try {
      const affliateAddress = await getReferredBy(address);

      return affliateAddress?.affiliateAddress;
    } catch (error) {
      log('useReferredBy', error);
      return undefined;
    }
  };

  const { data, isFetched } = useQuery({
    queryKey: ['referredBy', dydxAddress],
    queryFn,
    enabled: Boolean(dydxAddress),
  });

  return { data, isFetched };
};
