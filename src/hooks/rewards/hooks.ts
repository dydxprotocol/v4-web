import { useQuery } from '@tanstack/react-query';

import { DydxAddress } from '@/constants/wallets';

import { wrapAndLogError } from '@/lib/asyncUtils';

export type ChaosLabsLeaderboardItem = {
  rank: number;
  account: DydxAddress;
  accountLabel: string;
  incentivePoints: number;
  updatedAt: number;
};

const volumeQuery = `query VolumeLeaderboard($query: LeaderboardQuery!) {\n incentivesLeaderboard(query: $query) {\n  rank\n  account\n  accountLabel\n  markets\n  incentivePoints\n  updatedAt\n  roi\n  pnl\n  __typename\n }\n}`;

async function getChaosLabsPointsDistribution() {
  const res = await fetch(`https://cloud.chaoslabs.co/query/ccar-perpetuals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      protocol: 'dydx-v4',
      'apollographql-client-name': 'dydx-v4',
    },
    body: JSON.stringify({
      operationName: 'VolumeLeaderboard',
      query: volumeQuery,
      variables: {
        query: {
          type: 'Volume',
          skip: 0,
          sort: 'takerFeesRank',
          order: 'Ascending',
          search: null,
        },
      },
    }),
  });
  const parsedRes = (await res.json()) as {
    data: { incentivesLeaderboard: ChaosLabsLeaderboardItem[] };
  };
  return parsedRes.data.incentivesLeaderboard;
}

export function useChaosLabsPointsDistribution() {
  return useQuery({
    queryKey: ['chaoslabs/points'],
    queryFn: wrapAndLogError(
      () => getChaosLabsPointsDistribution(),
      'LaunchIncentives/fetchDistribution',
      true
    ),
  });
}
