import { useQuery } from '@tanstack/react-query';

import { useDydxClient } from './useDydxClient';

export const useReferralAddress = (refCode: string) => {
  const { compositeClient } = useDydxClient();

  const queryFn = async () => {
    if (!compositeClient || !refCode) {
      return undefined;
    }
    const endpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/address`;
    const response = await fetch(`${endpoint}?referralCode=${encodeURIComponent(refCode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data?.address as string | undefined;
  };

  const { data, isFetched } = useQuery({
    queryKey: ['referralAddress', refCode],
    queryFn,
    enabled: Boolean(compositeClient && refCode),
  });

  return { data, isFetched };
};
