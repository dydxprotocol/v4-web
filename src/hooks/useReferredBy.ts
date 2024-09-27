import { useQuery } from '@tanstack/react-query';

import { useAccounts } from './useAccounts';
import { useSubaccount } from './useSubaccount';

export const useReferralAddress = () => {
  const { dydxAddress } = useAccounts();
  const { getReferredBy } = useSubaccount();

  const queryFn = async () => {
    if (!dydxAddress) {
      return undefined;
    }
    const affliateAddress = await getReferredBy(dydxAddress);

    return affliateAddress;
  };

  const { data, isFetched } = useQuery({
    queryKey: ['referredBy', dydxAddress],
    queryFn,
    enabled: Boolean(dydxAddress),
  });

  return { data, isFetched };
};
