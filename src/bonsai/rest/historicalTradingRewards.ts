import { useMemo } from 'react';

import { TradingRewardAggregationPeriod } from '@dydxprotocol/v4-client-js';
import { useQuery } from '@tanstack/react-query';

import { EMPTY_ARR } from '@/constants/objects';
import { timeUnits } from '@/constants/time';
import { IndexerHistoricalTradingRewardAggregation } from '@/types/indexer/indexerApiGen';
import { isIndexerHistoricalTradingRewardAggregationResponse } from '@/types/indexer/indexerChecks';

import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';

import { mapIfPresent } from '@/lib/do';
import { BIG_NUMBERS } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { calculateDailyCumulativeTradingRewards } from '../calculators/historicalTradingRewards';
import { useIndexerClient } from './lib/useIndexer';

const MAX_REQUESTS = 10;

export function useHistoricalTradingRewards() {
  const address = useAppSelector(getUserWalletAddress);
  const { indexerClient, key: indexerKey } = useIndexerClient();

  return useQuery({
    enabled: isPresent(address) && isPresent(indexerClient),
    queryKey: ['indexer', 'account', 'historicalTradingRewards', address, indexerKey],
    queryFn: async () => {
      if (address == null || indexerClient == null) {
        throw new Error('Invalid historical trading rewards query state');
      }

      const allResults: IndexerHistoricalTradingRewardAggregation[] = [];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
      for (let request = 0; request < MAX_REQUESTS; request += 1) {
        // eslint-disable-next-line no-await-in-loop
        const thisResult = await indexerClient.account.getHistoricalTradingRewardsAggregations(
          address,
          TradingRewardAggregationPeriod.DAILY,
          undefined,
          // one second before oldest current result
          mapIfPresent(allResults.at(-1), (r) =>
            new Date(new Date(r.startedAt).getTime() - timeUnits.second).toISOString()
          ) ?? undefined
        );

        const typedResult = isIndexerHistoricalTradingRewardAggregationResponse(thisResult);
        const resultArr = typedResult.rewards;

        // so this only happens when the actual response was empty
        if (resultArr.length === 0) {
          break;
        }

        allResults.push(...resultArr);
      }

      return allResults;
    },
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
}

export function useHistoricalTradingRewardsWeekly() {
  const address = useAppSelector(getUserWalletAddress);
  const { indexerClient, key: indexerKey } = useIndexerClient();

  return useQuery({
    enabled: isPresent(address) && isPresent(indexerClient),
    queryKey: ['indexer', 'account', 'weeklyHistoricTradingRewards', address, indexerKey],
    queryFn: async () => {
      if (address == null || indexerClient == null) {
        throw new Error('Invalid historical trading rewards query state');
      }
      const thisResult = await indexerClient.account.getHistoricalTradingRewardsAggregations(
        address,
        TradingRewardAggregationPeriod.WEEKLY,
        undefined,
        undefined
      );

      const typedResult = isIndexerHistoricalTradingRewardAggregationResponse(thisResult);
      const resultArr = typedResult.rewards;
      return resultArr;
    },
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
}

/**
 * @returns total cumulative trading rewards
 */
export function useTotalTradingRewards() {
  const historicalTradingRewardsQuery = useHistoricalTradingRewards();
  const tradingRewards = historicalTradingRewardsQuery.data ?? EMPTY_ARR;

  const lifetimeTradingRewards = useMemo(() => {
    return tradingRewards.reduce((acc, { tradingReward }) => {
      return acc.plus(tradingReward);
    }, BIG_NUMBERS.ZERO);
  }, [tradingRewards]);

  return {
    ...historicalTradingRewardsQuery,
    data: lifetimeTradingRewards,
  };
}

/**
 * @returns chartData for daily cumulative trading rewards (includes dummy entries for days that have no trading rewards)
 */
export function useDailyCumulativeTradingRewards() {
  const { data: tradingRewards, status, error } = useHistoricalTradingRewards();

  const chartData = useMemo(
    () => calculateDailyCumulativeTradingRewards(tradingRewards),
    [tradingRewards]
  );

  return {
    error,
    data: chartData,
    status,
  };
}
