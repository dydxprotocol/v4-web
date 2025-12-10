import { BonsaiCore } from '@/bonsai/ontology';
import { useQuery } from '@tanstack/react-query';

import { DydxAddress } from '@/constants/wallets';

import { useAppSelector } from '@/state/appTypes';

import { wrapAndLogError } from '@/lib/asyncUtils';
import { mapIfPresent } from '@/lib/do';

import { useQueryChaosLabsIncentives } from '../useQueryChaosLabsIncentives';
import {
  CURRENT_SURGE_REWARDS_DETAILS,
  feesToEstimatedDollarRewards,
  pointsToEstimatedDollarRewards,
  pointsToEstimatedDydxRewards,
} from './util';

export type ChaosLabsPointsItem = {
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
    data: { incentivesLeaderboard: ChaosLabsPointsItem[] };
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
        CURRENT_SURGE_REWARDS_DETAILS.rewardAmountUsd
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
    data: mapIfPresent(
      pointsToEstimatedDollarRewards(
        points?.incentivePoints,
        totalPoints?.totalPoints,
        totalUsdRewards
      ),
      points?.totalFees,
      (pointRewards, feesPaid) => {
        return pointRewards + feesPaid;
      }
    ),
    isLoading: totalPointsLoading || pointsLoading,
  };
};

export type ChaosLabsPnlItem = {
  address: string;
  pnl: number;
  startOfThisWeekPnlSnapshot: {
    equity: string;
    totalPnl: string;
  };
  volume: number;
  position: number;
  dollarReward: number;
};

async function getChaosLabsPnlDistribution() {
  const res = await fetch(
    `https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-weekly-clc?perPage=1000`,
    {
      method: 'GET',
    }
  );
  const parsedRes = (await res.json()) as {
    data: ChaosLabsPnlItem[];
  };

  return parsedRes.data;
}

export function useChaosLabsPnlDistribution() {
  const dydxPrice = useAppSelector(BonsaiCore.rewardParams.data).tokenPrice;

  const { data: pnlItems, isLoading: pnlItemsLoading } = useQuery({
    queryKey: ['chaoslabs/pnls'],
    queryFn: wrapAndLogError(
      () => getChaosLabsPnlDistribution(),
      'LaunchIncentives/fetchPnls',
      true
    ),
  });

  return {
    isLoading: pnlItemsLoading || !dydxPrice,
    data: pnlItems,
  };
}

export type ChaosLabsLeaderboardItem = {
  rank: number;
  account: string;
  estimatedDydxRewards: string | number;
};

export type ChaosLabsCompetitionItem = {
  rank: number;
  account: string;
  dollarReward: number;
  pnl: number;
};

export function useChaosLabsFeeLeaderboard({ address }: { address?: string }) {
  return useQuery({
    queryKey: ['chaoslabs/fee-leaderboard', address],
    queryFn: wrapAndLogError(
      () => getChaosLabsFeeLeaderboard({ address }),
      'LaunchIncentives/fetchFeeLeaderboard',
      true
    ),
  });
}

export type ChaosLabsFeeLeaderboardItemWithRewards = {
  address: string;
  total_fees: number;
  rank: number;
  estimatedDollarRewards: number;
  estimatedDydxRewards: number;
};

export type ChaosLabsFeeLeaderboardItem = {
  address: string;
  total_fees: number;
  rank: number;
};

type ChaosLabsFeeLeaderboardResponse = {
  success: boolean;
  addressEntry?: ChaosLabsFeeLeaderboardItem;
  data: ChaosLabsFeeLeaderboardItem[];
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    perPage: number;
  };
};

export const addRewardsToLeaderboardEntry = (
  entry: ChaosLabsFeeLeaderboardItem,
  dydxPrice: number | undefined
): ChaosLabsFeeLeaderboardItemWithRewards => {
  const dollarRewards = feesToEstimatedDollarRewards(entry.total_fees);
  const dydxRewards = dydxPrice ? dollarRewards / dydxPrice : 0;
  return {
    ...entry,
    estimatedDollarRewards: dollarRewards,
    estimatedDydxRewards: dydxRewards,
  };
};

async function getChaosLabsFeeLeaderboard({ address }: { address?: string }) {
  const res = await fetch(
    `https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-fee-leaderboard?perPage=1000${address ? `&address=${address}` : ''}`
  );

  const data = (await res.json()) as ChaosLabsFeeLeaderboardResponse;
  return {
    leaderboard: data.data,
    addressEntry: data.addressEntry,
  };
}
