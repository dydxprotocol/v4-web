import { useQuery } from '@tanstack/react-query';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

type AffiliatesMetadata = {
  referralCode: string;
  isVolumeEligible: boolean;
  isAffiliate: boolean;
};

process.env.VITE_AFFILIATES_SERVER_BASE_URL = 'http://localhost:3000';

export const useAffiliatesInfo = (dydxAddress?: string) => {
  const { compositeClient, getAffiliateInfo } = useDydxClient();

  const fetchAffiliateMetadata = async () => {
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

  const fetchProgramStats = async () => {
    // process.env.VITE_AFFILIATES_SERVER_BASE_URL = 'http://localhost:3000'; Local

    const endpoint = `${process.env.VITE_AFFILIATES_SERVER_BASE_URL}/v1/community/program-stats`;

    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      const data = await res.json();
      return data;
    } catch (error) {
      log('useAffiliatesInfo/fetchProgramStats', error, { endpoint });
      throw error;
    }
  };

  const fetchAccountStats = async () => {
    // process.env.VITE_AFFILIATES_SERVER_BASE_URL = 'http://localhost:3000'; Local

    const endpoint = `${process.env.VITE_AFFILIATES_SERVER_BASE_URL}/v1/leaderboard/account/${dydxAddress}`;

    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      const data = await res.json();

      return data;
    } catch (error) {
      log('useAffiliatesInfo/fetchAccountStats', error, { endpoint });
      throw error;
    }
  };

  const fetchLastUpdated = async () => {
    // process.env.VITE_AFFILIATES_SERVER_BASE_URL = 'http://localhost:3000'; Local

    const endpoint = `${process.env.VITE_AFFILIATES_SERVER_BASE_URL}/v1/last-updated`;

    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      const data = await res.json();

      return data;
    } catch (error) {
      log('useAffiliatesInfo/fetchLastUpdated', error, { endpoint });
      throw error;
    }
  };

  const affiliateMetadataQuery = useQuery({
    queryKey: ['affiliateMetadata', dydxAddress],
    queryFn: fetchAffiliateMetadata,
    enabled: Boolean(compositeClient && dydxAddress),
  });

  const programStatsQuery = useQuery({
    queryKey: ['programStats'],
    queryFn: fetchProgramStats,
    enabled: Boolean(compositeClient),
  });

  const affiliateStatsQuery = useQuery({
    queryKey: ['accountStats', dydxAddress],
    queryFn: fetchAccountStats,
    enabled: Boolean(dydxAddress),
  });

  const lastUpdatedQuery = useQuery({
    queryKey: ['lastUpdated'],
    queryFn: fetchLastUpdated,
  });

  return {
    affiliateMetadataQuery,
    programStatsQuery,
    affiliateStatsQuery,
    lastUpdatedQuery,
  };
};
