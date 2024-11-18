import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { IAffiliateLeaderboardStats, IAffiliateStats } from '@/constants/affiliates';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

const PAGE_SIZE = 100;

export const useAffiliatesLeaderboard = () => {
  const { compositeClient } = useDydxClient();

  const fetchAffiliateStats = async () => {
    const endpoint = `${compositeClient.indexerClient.config.restEndpoint}/v4/affiliates/snapshot?sortByAffiliateEarning=true&limit=${PAGE_SIZE}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data?.affiliateList;
    } catch (error) {
      log('useAffiliateLeaderboard', error, { endpoint });
      throw error;
    }
  };

  const affiliatesLeaderboardQuery = useQuery({
    queryKey: ['affiliatesLeaderboard'],
    queryFn: fetchAffiliateStats,
    enabled: Boolean(compositeClient),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const affiliates: IAffiliateLeaderboardStats[] | undefined = useMemo(
    () =>
      affiliatesLeaderboardQuery.data?.map((stat: IAffiliateStats, i: number) => ({
        ...stat,
        rank: i + 1,
      })),
    [affiliatesLeaderboardQuery.data]
  );

  return { affiliates };
};
