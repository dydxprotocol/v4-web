import { BonsaiCore } from '@/bonsai/ontology';
import { useQuery } from '@tanstack/react-query';

import {
  DEFAULT_MAX_AFFILIATE_SHARE,
  DEFAULT_TAKER_3_FEE,
  MAX_AFFILIATE_VIP_SHARE,
  REF_SHARE_VOLUME_CAP_USD,
} from '@/constants/affiliates';
import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';

import { safeFetch } from '@/lib/safeFetch';
import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

type AffiliatesMetadata = {
  referralCode: string;
  isVolumeEligible: boolean;
  isAffiliate: boolean;
};

export const useAffiliateMetadata = (dydxAddress?: string) => {
  const { compositeClient, getAffiliateInfo } = useDydxClient();

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
    queryKey: ['affiliateMetadata', dydxAddress],
    queryFn: fetchAffiliateMetadata,
    enabled: Boolean(compositeClient && dydxAddress),
    staleTime: 5 * timeUnits.minute,
    refetchOnMount: 'always',
  });

  return affiliateMetadataQuery;
};

const useAffiliatesStatus = (dydxAddress?: string) => {
  const { compositeClient } = useDydxClient();

  const fetchAccountStats = async () => {
    if (!dydxAddress || !compositeClient) return undefined;

    const endpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/snapshot?addressFilter=${encodeURIComponent(dydxAddress)}`;

    try {
      const res = await safeFetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      const data = await res.json();
      const affiliateStats = data?.affiliateList?.[0];
      return affiliateStats ?? null;
    } catch (error) {
      log('useAffiliatesInfo/fetchAccountStats', error, { endpoint });
      throw error;
    }
  };

  const affiliateStatsQuery = useQuery({
    queryKey: ['accountStats', dydxAddress],
    queryFn: fetchAccountStats,
    enabled: Boolean(compositeClient && dydxAddress),
    staleTime: 5 * timeUnits.minute,
  });

  return affiliateStatsQuery;
};

const useAffiliateMaxEarning = () => {
  const { compositeClient, getAllAffiliateTiers } = useDydxClient();
  const feeTiers = useAppSelector(BonsaiCore.configs.feeTiers);

  const fetchAffiliateMaxEarning = async () => {
    const allAffiliateTiers = await getAllAffiliateTiers();
    const lastTier = allAffiliateTiers?.at(-1);
    const maxRevshare = lastTier
      ? lastTier.takerFeeSharePpm / 1_000_000
      : DEFAULT_MAX_AFFILIATE_SHARE;
    const taker3FeeTier = feeTiers?.[2]?.taker ?? DEFAULT_TAKER_3_FEE;

    const maxEarning = taker3FeeTier * maxRevshare * REF_SHARE_VOLUME_CAP_USD;
    const maxVipEarning = taker3FeeTier * MAX_AFFILIATE_VIP_SHARE * REF_SHARE_VOLUME_CAP_USD;
    return { maxEarning, maxVipEarning };
  };

  const affiliateMaxEarningQuery = useQuery({
    queryKey: ['affiliateMaxEarning', feeTiers],
    queryFn: fetchAffiliateMaxEarning,
    enabled: Boolean(compositeClient && feeTiers),
    staleTime: Infinity,
  });

  return affiliateMaxEarningQuery;
};

export const useAffiliatesInfo = (dydxAddress?: string) => {
  const affiliateMetadataQuery = useAffiliateMetadata(dydxAddress);
  const affiliateStatsQuery = useAffiliatesStatus(dydxAddress);
  const affiliateMaxEarningQuery = useAffiliateMaxEarning();

  return {
    affiliateMetadataQuery,
    affiliateStatsQuery,
    affiliateMaxEarningQuery,
  };
};
