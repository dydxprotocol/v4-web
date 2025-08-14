import { useQuery } from '@tanstack/react-query';

import { DydxAddress } from '@/constants/wallets';

import { wrapAndLogError } from '@/lib/asyncUtils';

export type ChaosLabsLeaderboardItem = {
  rank: number;
  address: DydxAddress;
  rewards: number;
};

async function getChaosLabsPointsDistribution(season: number) {
  const res = await fetch(
    `https://cloud.chaoslabs.co/query/api/dydx/reward-distribution?season=${season}`
  );
  const parsedRes = (await res.json()) as { address: DydxAddress; rewards: number }[];

  return parsedRes.map((item, i) => ({ ...item, rank: i + 1 })) as ChaosLabsLeaderboardItem[];
}

export function useChaosLabsPointsDistribution(season: number) {
  return useQuery({
    queryKey: ['chaoslabs/points', season],
    queryFn: wrapAndLogError(
      () => getChaosLabsPointsDistribution(season),
      'LaunchIncentives/fetchDistribution',
      true
    ),
  });
}
