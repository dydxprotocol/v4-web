import { BonsaiCore } from '@/bonsai/ontology';
import { MarketInfo } from '@/bonsai/types/summaryTypes';
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

export type BonkPnlItem = {
  address: string;
  pnl: number;
  volume: number;
  position: number;
};

export type BonkPnlLeaderboardItem = {
  address: string;
  pnl: number;
  position: number;
  tickers: MarketInfo['assetId'][];
  volume: number;
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

async function getBonkPnlDistribution() {
  const res = await fetch(
    'https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-weekly-bonk-pnl',
    {
      method: 'GET',
    }
  );
  const parsedRes = await res.json();
  return parsedRes.data as BonkPnlItem[];
}

export function useBonkPnlDistribution() {
  const { data: bonkPnlItems, isLoading: bonkPnlItemsLoading } = useQuery({
    queryKey: ['bonk/pnls'],
    queryFn: wrapAndLogError(() => getBonkPnlDistribution(), 'BonkPnl/fetchPnls', true),
  });

  return {
    isLoading: bonkPnlItemsLoading,
    data: bonkPnlItems,
  };
}

async function getBonkPnlLeaderboard() {
  const res = await fetch(
    'https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-bonk-pnl-all-time?perPage=2000'
  );
  const parsedRes = await res.json();
  return parsedRes.data as BonkPnlLeaderboardItem[];
}

export function useBonkPnlLeaderboard() {
  const { data: bonkPnlLeaderboardItems, isLoading: bonkPnlLeaderboardItemsLoading } = useQuery({
    queryKey: ['bonk/pnl-leaderboard'],
    queryFn: wrapAndLogError(() => getBonkPnlLeaderboard(), 'BonkPnl/fetchLeaderboard', true),
  });

  return {
    isLoading: bonkPnlLeaderboardItemsLoading,
    data: bonkPnlLeaderboardItems,
  };
}

export type RwaMarketPnlItem = {
  address: string;
  pnl: number;
  volume: number;
  position: number;
};

type RwaMarketPnlResponse = {
  success: boolean;
  market: string | null;
  week: number | null;
  data: RwaMarketPnlItem[];
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    perPage: number;
  };
};

async function getRwaMarketPnl() {
  const res = await fetch(
    'https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-weekly-bonk-market-pnl?perPage=1000'
  );
  const parsedRes = (await res.json()) as RwaMarketPnlResponse;
  return {
    data: parsedRes.data,
    market: parsedRes.market,
    week: parsedRes.week,
  };
}

export function useRwaMarketPnl() {
  const { data, isLoading } = useQuery({
    queryKey: ['rwa-market-pnl'],
    queryFn: wrapAndLogError(() => getRwaMarketPnl(), 'RwaMarketPnl/fetch', true),
  });

  return {
    isLoading,
    data: data?.data,
    market: data?.market ?? null,
    week: data?.week ?? null,
  };
}

export type LiquidationLeaderboardItem = {
  address: string;
  total_liquidation_losses: string;
  rank: number;
};

type LiquidationLeaderboardResponse = {
  success: boolean;
  data: LiquidationLeaderboardItem[];
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    perPage: number;
  };
};

async function getLiquidationLeaderboard() {
  const res = await fetch(
    `https://pp-external-api-ffb2ad95ef03.herokuapp.com/api/dydx-liquidation-leaderboard?perPage=1000`
  );

  const data = (await res.json()) as LiquidationLeaderboardResponse;
  return data.data;
}

export function useLiquidationLeaderboard() {
  return useQuery({
    queryKey: ['dydx-liquidation-leaderboard'],
    queryFn: wrapAndLogError(
      () => getLiquidationLeaderboard(),
      'LaunchIncentives/fetchLiquidationLeaderboard',
      true
    ),
  });
}
