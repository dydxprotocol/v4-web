import { useQuery } from '@tanstack/react-query';

import { IAffiliateStats } from '@/constants/affiliates';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

const PAGE_SIZE = 100;

export const useAffiliatesLeaderboard = () => {
  const { compositeClient } = useDydxClient();

  const fetchAffiliateStats = async () => {
    if (!compositeClient) return undefined;

    const endpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/snapshot?sortByAffiliateEarning=true&limit=${PAGE_SIZE}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data?.affiliateList
        ?.filter((stat: IAffiliateStats) => Boolean(stat.affiliateReferralCode))
        ?.map((stat: IAffiliateStats, i: number) => ({
          ...stat,
          rank: i + 1,
        }));
    } catch (error) {
      log('useAffiliateLeaderboard', error, { endpoint });
      throw error;
    }
  };

  return useQuery({
    queryKey: ['affiliatesLeaderboard'],
    queryFn: fetchAffiliateStats,
    enabled: Boolean(compositeClient),
    refetchOnMount: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
