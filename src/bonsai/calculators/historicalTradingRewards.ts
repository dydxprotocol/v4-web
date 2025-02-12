import { groupBy, orderBy } from 'lodash';
import { DateTime } from 'luxon';

import { EMPTY_ARR } from '@/constants/objects';
import { IndexerHistoricalTradingRewardAggregation } from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

function getFormattedDate(date: string | number) {
  if (typeof date === 'number') {
    return DateTime.fromMillis(date).toFormat('yyyy-MM-dd');
  }

  return DateTime.fromISO(date).toFormat('yyyy-MM-dd');
}

export function calculateDailyCumulativeTradingRewards(
  tradingRewards?: IndexerHistoricalTradingRewardAggregation[]
) {
  if (tradingRewards == null) {
    return EMPTY_ARR;
  }

  // Create map of rewards keyed by day
  const rewardsKeyedByDay = groupBy(tradingRewards, ({ startedAt }) => getFormattedDate(startedAt));

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
