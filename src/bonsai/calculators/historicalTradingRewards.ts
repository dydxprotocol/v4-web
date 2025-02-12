import { groupBy, orderBy } from 'lodash';
import { DateTime } from 'luxon';

import { EMPTY_ARR } from '@/constants/objects';
import { timeUnits } from '@/constants/time';
import {
  IndexerHistoricalTradingRewardAggregation,
  IndexerTradingRewardAggregationPeriod,
} from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

const NO_CREATED_AT_HEIGHT_SPECIAL_STRING = '______UNUSED_CREATED_AT_HEIGHT______';

function getFormattedDate(date: string | number) {
  if (typeof date === 'number') {
    return DateTime.fromMillis(date).toFormat('yyyy-MM-dd');
  }

  return DateTime.fromISO(date).toFormat('yyyy-MM-dd');
}

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

export function calculateDailyCumulativeTradingRewards(
  tradingRewards?: IndexerHistoricalTradingRewardAggregation[]
) {
  if (tradingRewards == null) {
    return EMPTY_ARR;
  }

  // Create map of rewards keyed by day
  const rewardsKeyedByDay = groupBy(tradingRewards, ({ startedAt }) => getFormattedDate(startedAt));

  // Shim all missing dates between earliest and latest event
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
}
