import { useEffect, useState } from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';

import { IAffiliateStats } from '@/constants/affiliates';

const fetchAffiliateStats = async ({ pageParam = 1 }) => {
  const endpoint = `${import.meta.env.VITE_AFFILIATES_SERVER_BASE_URL}/v1/leaderboard/search`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pagination: { page: pageParam, pageSize: 10 } }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch leaderboard data');
  }

  const data = await response.json();
  return data;
};

export const useAffiliatesLeaderboard = () => {
  const [page, setPage] = useState(1);

  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ['affiliatesLeaderboard'],
    queryFn: fetchAffiliateStats,
    initialPageParam: page,
    getNextPageParam: (lastPage, allPages) => {
      if (allPages.length * 10 < lastPage.total) {
        return allPages.length + 1;
      } else {
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (page > 1) {
      fetchNextPage();
    }
  }, [page, fetchNextPage]);

  const affiliates: IAffiliateStats[] = data?.pages.flatMap((page) => page.results) || [];
  const total: number = data?.pages[0]?.total || 0;

  return { affiliates, total, page, setPage };
};
