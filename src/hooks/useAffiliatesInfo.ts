import { useQuery } from '@tanstack/react-query';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

type AffiliatesMetadata = {
  referralCode: string;
  isVolumeEligible: boolean;
  isAffiliate: boolean;
};

export const useAffiliatesInfo = (dydxAddress?: string) => {
  const { compositeClient, getAffiliateInfo } = useDydxClient();

  const queryFn = async () => {
    if (!compositeClient || !dydxAddress) {
      return {};
    }
    const endpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/metadata`;

    try {
      const response = await fetch(`${endpoint}?address=${encodeURIComponent(dydxAddress)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const affiliateInfo = await getAffiliateInfo(dydxAddress);

      const data: AffiliatesMetadata | undefined = await response.json();
      const isEligible = Boolean(data?.isVolumeEligible) || Boolean(affiliateInfo?.isWhitelisted);

      return { metadata: data, affiliateInfo, isEligible };
    } catch (error) {
      log('useAffiliatesInfo', error, { endpoint });
      throw error;
    }
  };

  const query = useQuery({
    queryKey: ['affiliatesMetadata', dydxAddress],
    queryFn,
    enabled: Boolean(compositeClient && dydxAddress),
  });

  return query;
};
