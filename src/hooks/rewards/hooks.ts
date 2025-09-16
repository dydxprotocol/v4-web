import { BonsaiCore } from '@/bonsai/ontology';
import { useQuery } from '@tanstack/react-query';

import { DydxAddress } from '@/constants/wallets';

import { useAppSelector } from '@/state/appTypes';

import { wrapAndLogError } from '@/lib/asyncUtils';

import { useQueryChaosLabsIncentives } from '../useQueryChaosLabsIncentives';
import {
  pointsToEstimatedDollarRewards,
  pointsToEstimatedDydxRewards,
  SEPT_2025_REWARDS_DETAILS,
} from './util';

export type ChaosLabsLeaderboardItem = {
  rank: number;
  account: DydxAddress;
  accountLabel: string;
  incentivePoints: number;
  updatedAt: number;
  estimatedDydxRewards: number | string;
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
  const { data: pointsInfo, isLoading: rewardsInfoLoading } = useTotalRewardsPoints();
  const dydxPrice = useAppSelector(BonsaiCore.rewardParams.data).tokenPrice;

  const { data: leaderboardItems, isLoading: leaderboardItemsLoading } = useQuery({
    queryKey: ['chaoslabs/points'],
    queryFn: wrapAndLogError(
      () => getChaosLabsPointsDistribution(),
      'LaunchIncentives/fetchDistribution',
      true
    ),
  });

  return {
    isLoading: rewardsInfoLoading || leaderboardItemsLoading || !dydxPrice,
    data: leaderboardItems?.map((item) => ({
      ...item,
      estimatedDydxRewards: pointsToEstimatedDydxRewards(
        item.incentivePoints,
        pointsInfo?.totalPoints,
        dydxPrice,
        SEPT_2025_REWARDS_DETAILS.rewardAmountUsd
      ),
    })),
  };
}

async function getTotalRewardsPoints() {
  const res = await fetch('https://cloud.chaoslabs.co/query/api/dydx/total-points');
  const data = (await res.json()) as { totalPoints: number; seasonNumber: number };
  return data;
}

export function useTotalRewardsPoints() {
  return useQuery({
    queryKey: ['total-rewards-points'],
    queryFn: () => getTotalRewardsPoints(),
  });
}

export const useChaosLabsUsdRewards = ({
  dydxAddress,
  season,
  totalUsdRewards,
}: {
  dydxAddress?: DydxAddress;
  season?: number;
  totalUsdRewards?: number;
}) => {
  const { data: totalPoints, isLoading: totalPointsLoading } = useTotalRewardsPoints();
  const { data: points, isLoading: pointsLoading } = useQueryChaosLabsIncentives({
    dydxAddress,
    season,
  });

  return {
    data: pointsToEstimatedDollarRewards(
      points?.incentivePoints,
      totalPoints?.totalPoints,
      totalUsdRewards
    ),
    isLoading: totalPointsLoading || pointsLoading,
  };
};
