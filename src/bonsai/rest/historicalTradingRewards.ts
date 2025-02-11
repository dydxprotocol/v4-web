import { useMemo } from 'react';

import { TradingRewardAggregationPeriod } from '@dydxprotocol/v4-client-js';
import { useQuery } from '@tanstack/react-query';
import { groupBy, orderBy } from 'lodash';
import { DateTime } from 'luxon';

import { timeUnits } from '@/constants/time';
import {
  IndexerHistoricalTradingRewardAggregation,
  IndexerTradingRewardAggregationPeriod,
} from '@/types/indexer/indexerApiGen';
import { isIndexerHistoricalTradingRewardAggregationResponse } from '@/types/indexer/indexerChecks';

import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';

import { mapIfPresent } from '@/lib/do';
import { BIG_NUMBERS } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { isPresent } from '@/lib/typeUtils';

import { useIndexerClient } from './lib/useIndexer';

const MAX_REQUESTS = 15;
const MAX_TIME_DAYS = 91;

export function useHistoricalTradingRewards() {
  const address = useAppSelector(getUserWalletAddress);
  const { indexerClient, key: indexerKey } = useIndexerClient();

  return useQuery({
    enabled: isPresent(address) && isPresent(indexerClient),
    queryKey: ['indexer', 'accountHistoricalTradingRewards', address, indexerKey],
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

        if (
          allResults.length > 0 &&
          new Date(allResults.at(-1)!.startedAt).getTime() <
            new Date().getTime() - timeUnits.day * MAX_TIME_DAYS
        ) {
          break;
        }
      }

      return allResults;
    },
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
}

export function useTotalTradingRewards() {
  const { data: tradingRewards, status } = useHistoricalTradingRewards();

  const lifetimeTradingRewards = useMemo(() => {
    if (tradingRewards == null) {
      return undefined;
    }

    return tradingRewards.reduce((acc, { tradingReward }) => {
      return acc.plus(tradingReward);
    }, BIG_NUMBERS.ZERO);
  }, [tradingRewards]);

  return {
    data: lifetimeTradingRewards,
    loading: status,
  };
}

const NO_CREATED_AT_HEIGHT_SPECIAL_STRING = '______UNUSED_CREATED_AT_HEIGHT______';

export function useHistoricalTradingRewardsFilled() {
  const { data: tradingRewards, status } = useHistoricalTradingRewards();

  const getFormattedDate = (date: string | number) => {
    if (typeof date === 'number') {
      return DateTime.fromMillis(date).toFormat('yyyy-MM-dd');
    }

    return DateTime.fromISO(date).toFormat('yyyy-MM-dd');
  };

  function createDummyAggregatedTradingReward(
    timestamp: number
  ): IndexerHistoricalTradingRewardAggregation[] {
    return [
      {
        startedAt: DateTime.fromMillis(timestamp).toISO()!,
        startedAtHeight: NO_CREATED_AT_HEIGHT_SPECIAL_STRING,
        endedAt: DateTime.fromMillis(timestamp + timeUnits.day - 1).toISO()!,
        endedAtHeight: NO_CREATED_AT_HEIGHT_SPECIAL_STRING,
        tradingReward: '0',
        period: IndexerTradingRewardAggregationPeriod.DAILY,
      },
    ];
  }

  const chartData = useMemo(() => {
    if (tradingRewards == null) {
      return [];
    }

    // Create map of rewards keyed by day
    const rewardsKeyedByDay = groupBy(tradingRewards, ({ startedAt }) =>
      getFormattedDate(startedAt)
    );

    // Shim all dates from the first to the last date
    const earliestEvent = tradingRewards.at(-1)?.startedAt;
    const latestEvent = tradingRewards.at(0)?.startedAt;
    if (earliestEvent && latestEvent) {
      const startMs = new Date(earliestEvent).getTime();
      const endMs = new Date(latestEvent).getTime();
      let toSet = startMs + timeUnits.day;

      while (toSet > startMs && toSet < endMs) {
        const key = getFormattedDate(toSet);
        if (!rewardsKeyedByDay[key]) {
          // Add a dummy entry if date has no trading reward events
          rewardsKeyedByDay[key] = createDummyAggregatedTradingReward(toSet);
        }

        toSet += timeUnits.day;
      }
    }

    // sort objectEntries from earliest -> latest
    const sortedRewards = orderBy(
      objectEntries(rewardsKeyedByDay),
      [([startedAt]) => new Date(startedAt).getTime()],
      ['asc']
    );

    // Calculate cumulative amount
    let cumulativeAmountBN = BIG_NUMBERS.ZERO;

    const processedChartData: {
      date: number;
      amount: number;
      cumulativeAmount: number;
    }[] = [];

    sortedRewards.forEach(([date, rewards]) => {
      const totalForDate = rewards.reduce((acc, { tradingReward }) => {
        return acc.plus(tradingReward);
      }, BIG_NUMBERS.ZERO);

      cumulativeAmountBN = cumulativeAmountBN.plus(totalForDate);

      processedChartData.push({
        date: new Date(date).getTime(),
        amount: totalForDate.toNumber(),
        cumulativeAmount: cumulativeAmountBN.toNumber(),
      });
    });

    return processedChartData;
  }, [tradingRewards]);

  return {
    data: chartData,
    loading: status,
  };
}
