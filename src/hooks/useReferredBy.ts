import { useQuery } from '@tanstack/react-query';

import { log } from '@/lib/telemetry';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';

export const useReferredBy = () => {
  const { dydxAddress } = useAccounts();
  const { getReferredBy } = useDydxClient();

  const queryFn = async () => {
    if (!dydxAddress) {
      return undefined;
    }
    try {
      const affliateAddress = await getReferredBy(dydxAddress);

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
