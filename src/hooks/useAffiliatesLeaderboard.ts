import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { IAffiliateStats } from '@/constants/affiliates';

import { log } from '@/lib/telemetry';

import { useEndpointsConfig } from './useEndpointsConfig';

export const useAffiliatesLeaderboard = () => {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [affiliatesPages, setAffiliatesPages] = useState<Record<number, IAffiliateStats[]>>({});
  const { affiliatesBaseUrl } = useEndpointsConfig();

  const fetchAffiliateStats = async () => {
    const endpoint = `${affiliatesBaseUrl}/v1/leaderboard/search`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pagination: { page, pageSize: 10 } }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      log('useAffiliateLeaderboard', error, { endpoint });
      throw error;
    }
  };

  const affiliatesLeaderboardQuery = useQuery({
    queryKey: ['affiliatesLeaderboard', page],
    queryFn: fetchAffiliateStats,
    enabled: Boolean(page && affiliatesBaseUrl),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (affiliatesLeaderboardQuery.data?.results) {
      setAffiliatesPages((prev) => ({
        ...prev,
        [affiliatesLeaderboardQuery.data.page]: affiliatesLeaderboardQuery.data.results,
      }));
      setTotal(affiliatesLeaderboardQuery.data.total);
    }
  }, [affiliatesLeaderboardQuery.data]);

  // merge all the affiliatesPages into a single array
  const affiliates = Object.values(affiliatesPages).flat();

  return { affiliates, total, page, setPage };
};
