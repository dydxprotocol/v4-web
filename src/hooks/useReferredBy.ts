import { useQuery } from '@tanstack/react-query';

import { DydxAddress } from '@/constants/wallets';

import { log } from '@/lib/telemetry';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';

export const useReferredBy = () => {
  const { dydxAddress } = useAccounts();
  const { getReferredBy, compositeClient } = useDydxClient();

  const queryFn = async ({ queryKey }: { queryKey: (string | DydxAddress | undefined)[] }) => {
    const [, address] = queryKey;
    if (!address) {
      return {};
    }
    try {
      const affliateAddress = await getReferredBy(address);

      return { affiliateAddress: affliateAddress?.affiliateAddress };
    } catch (error) {
      log('useReferredBy', error);
      throw error;
    }
  };

  const { data, isFetched } = useQuery({
    queryKey: ['referredBy', dydxAddress],
    queryFn,
    enabled: Boolean(compositeClient && dydxAddress),
  });

  return { data, isFetched };
};
