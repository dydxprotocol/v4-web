import { useQuery } from '@tanstack/react-query';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';

type AffiliatesMetadata = {
  referralCode: string;
  isVolumeEligible: boolean;
  isAffiliate: boolean;
};

export const useAffiliatesInfo = () => {
  const { dydxAddress } = useAccounts();
  const { compositeClient } = useDydxClient();

  const queryFn = async () => {
    if (!compositeClient || !dydxAddress) {
      return undefined;
    }
    const endpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/metadata`;
    const response = await fetch(`${endpoint}?address=${encodeURIComponent(dydxAddress)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data as AffiliatesMetadata | undefined;
  };

  const { data, isFetched } = useQuery({
    queryKey: ['affiliatesMetadata', dydxAddress],
    queryFn,
    enabled: Boolean(compositeClient && dydxAddress),
  });

  return { data, isFetched };
};
