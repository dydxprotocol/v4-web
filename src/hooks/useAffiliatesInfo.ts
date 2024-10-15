import { useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';

import {
  DEFAULT_MAX_AFFILIATE_SHARE,
  DEFAULT_TAKER_3_FEE,
  MAX_AFFILIATE_VIP_SHARE,
  REF_SHARE_VOLUME_CAP_USD,
} from '@/constants/affiliates';

import { useAppSelector } from '@/state/appTypes';
import { getFeeTiers } from '@/state/configsSelectors';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

type AffiliatesMetadata = {
  referralCode: string;
  isVolumeEligible: boolean;
  isAffiliate: boolean;
};

export const useAffiliatesInfo = (dydxAddress?: string) => {
  const { compositeClient, getAffiliateInfo, getAllAffiliateTiers } = useDydxClient();
  const feeTiers = useAppSelector(getFeeTiers, shallowEqual);

  const fetchAffiliateMetadata = async () => {
    if (!compositeClient || !dydxAddress) {
      return {};
    }
    const metadataEndpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/metadata`;
    const totalVolumeEndpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/total_volume`;

    try {
      const [metaDataResponse, totalVolumeResponse, affiliateInfo] = await Promise.all([
        fetch(`${metadataEndpoint}?address=${encodeURIComponent(dydxAddress)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${totalVolumeEndpoint}?address=${encodeURIComponent(dydxAddress)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        getAffiliateInfo(dydxAddress),
      ]);

      const data: AffiliatesMetadata | undefined = await metaDataResponse.json();
      const totalVolume: { totalVolume: number } | undefined = await totalVolumeResponse.json();
      const isEligible = Boolean(data?.isVolumeEligible) || Boolean(affiliateInfo?.isWhitelisted);

      return { metadata: data, affiliateInfo, isEligible, totalVolume: totalVolume?.totalVolume };
    } catch (error) {
      log('useAffiliatesInfo', error, { metadataEndpoint });
      throw error;
    }
  };

  const affiliateMetadataQuery = useQuery({
    queryKey: ['affiliatesMetadata', dydxAddress],
    queryFn: fetchAffiliateMetadata,
    enabled: Boolean(compositeClient && dydxAddress),
  });

  const fetchAffiliateMaxEarning = async () => {
    const allAffiliateTiers = await getAllAffiliateTiers();
    const lastTier = allAffiliateTiers?.at(-1);
    const maxRevshare = lastTier
      ? lastTier.takerFeeSharePpm / 1_000_000
      : DEFAULT_MAX_AFFILIATE_SHARE;
    const taker3FeeTier = feeTiers?.[2].taker ?? DEFAULT_TAKER_3_FEE;

    const maxEarning = taker3FeeTier * maxRevshare * REF_SHARE_VOLUME_CAP_USD;
    const maxVipEarning = taker3FeeTier * MAX_AFFILIATE_VIP_SHARE * REF_SHARE_VOLUME_CAP_USD;
    return { maxEarning, maxVipEarning };
  };

  const affiliateMaxEarningQuery = useQuery({
    queryKey: ['affiliateMaxEarning', compositeClient, feeTiers],
    queryFn: fetchAffiliateMaxEarning,
    enabled: Boolean(compositeClient && feeTiers),
  });

  return { affiliateMetadataQuery, affiliateMaxEarningQuery };
};
