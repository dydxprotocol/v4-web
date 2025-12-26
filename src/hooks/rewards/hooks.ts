import { BonsaiCore } from '@/bonsai/ontology';
import { useQuery } from '@tanstack/react-query';

import { useAppSelector } from '@/state/appTypes';

import { wrapAndLogError } from '@/lib/asyncUtils';

import { feesToEstimatedDollarRewards } from './util';

export type ClcPnlItem = {
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

async function getClcPnlDistribution() {
  const res = await fetch(
    `https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-weekly-clc?perPage=1000`,
    {
      method: 'GET',
    }
  );
  const parsedRes = (await res.json()) as {
    data: ClcPnlItem[];
  };

  return parsedRes.data;
}

export function useClcPnlDistribution() {
  const dydxPrice = useAppSelector(BonsaiCore.rewardParams.data).tokenPrice;

  const { data: pnlItems, isLoading: pnlItemsLoading } = useQuery({
    queryKey: ['clc-pnls'],
    queryFn: wrapAndLogError(() => getClcPnlDistribution(), 'LaunchIncentives/fetchPnls', true),
  });

  return {
    isLoading: pnlItemsLoading || !dydxPrice,
    data: pnlItems,
  };
}

export type IncentiveCompetitionItem = {
  rank: number;
  account: string;
  dollarReward: number;
  pnl: number;
};

export function useFeeLeaderboard({ address }: { address?: string }) {
  return useQuery({
    queryKey: ['dydx-fee-leaderboard', address],
    queryFn: wrapAndLogError(
      () => getDydxFeeLeaderboard({ address }),
      'LaunchIncentives/fetchFeeLeaderboard',
      true
    ),
  });
}

export type DydxFeeLeaderboardItemWithRewards = {
  address: string;
  total_fees: number;
  rank: number;
  estimatedDollarRewards: number;
  estimatedDydxRewards: number;
};

export type DydxFeeLeaderboardItem = {
  address: string;
  total_fees: number;
  rank: number;
};

type DydxFeeLeaderboardResponse = {
  success: boolean;
  addressEntry?: DydxFeeLeaderboardItem;
  data: DydxFeeLeaderboardItem[];
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    perPage: number;
  };
};

export const addRewardsToLeaderboardEntry = (
  entry: DydxFeeLeaderboardItem,
  dydxPrice: number | undefined
): DydxFeeLeaderboardItemWithRewards => {
  const dollarRewards = feesToEstimatedDollarRewards(entry.total_fees);
  const dydxRewards = dydxPrice ? dollarRewards / dydxPrice : 0;
  return {
    ...entry,
    estimatedDollarRewards: dollarRewards,
    estimatedDydxRewards: dydxRewards,
  };
};

async function getDydxFeeLeaderboard({ address }: { address?: string }) {
  const res = await fetch(
    `https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-fee-leaderboard?perPage=1000${address ? `&address=${address}` : ''}`
  );

  const data = (await res.json()) as DydxFeeLeaderboardResponse;
  return {
    leaderboard: data.data,
    addressEntry: data.addressEntry,
  };
}
