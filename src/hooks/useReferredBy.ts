import { useQuery } from '@tanstack/react-query';

import { log } from '@/lib/telemetry';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';

export const useReferredBy = () => {
  const { dydxAddress } = useAccounts();
  const { getReferredBy, compositeClient } = useDydxClient();
  const indexerEndpoint = compositeClient?.indexerClient.config.restEndpoint;

  const queryFn = async () => {
    if (!dydxAddress) {
      return {};
    }
    try {
      const affliateAddress = await getReferredBy(dydxAddress);

      return { affiliateAddress: affliateAddress?.affiliateAddress };
    } catch (error) {
      log('useReferredBy', error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ['referredBy', indexerEndpoint, dydxAddress],
    queryFn,
    enabled: Boolean(compositeClient && dydxAddress),
  });
};
