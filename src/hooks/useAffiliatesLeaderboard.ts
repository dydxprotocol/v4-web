import { useEffect, useState } from 'react';

import { IAffiliateStats } from '@/constants/affiliates';

import { log } from '@/lib/telemetry';

export const useAffiliatesLeaderboard = () => {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [affiliates, setAffiliates] = useState<IAffiliateStats[]>([]);

  useEffect(() => {
    fetchAffiliateStats();
  }, [page]);

  const fetchAffiliateStats = async () => {
    const endpoint = `${import.meta.env.VITE_AFFILIATES_SERVER_BASE_URL}/v1/leaderboard/search`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pagination: { page, pageSize: 10 } }),
      });

      const data = await response.json();

      setAffiliates((prev) => [...prev, ...data.results]);
      setTotal(data.total);
    } catch (error) {
      log('useAffiliateLeaderboard', error, { endpoint });
      throw error;
    }
  };

  return { affiliates, total, page, setPage };
};
