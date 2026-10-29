import { useQuery } from '@tanstack/react-query';

import { useDydxClient } from './useDydxClient';

export const useReferralAddress = (refCode?: string) => {
  const { compositeClient } = useDydxClient();
  const indexerEndpoint = compositeClient?.indexerClient.config.restEndpoint;

  const queryFn = async () => {
    if (!compositeClient || !refCode) {
      return undefined;
    }
    const endpoint = `${indexerEndpoint}/v4/affiliates/address`;
    const response = await fetch(`${endpoint}?referralCode=${encodeURIComponent(refCode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data?.address as string | undefined;
  };

  const query = useQuery({
    queryKey: ['referralAddress', indexerEndpoint, refCode],
    queryFn,
    enabled: Boolean(compositeClient && refCode),
    refetchOnWindowFocus: false,
  });

  return query;
};
