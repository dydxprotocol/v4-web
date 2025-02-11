import { groupBy, orderBy } from 'lodash';
import { DateTime } from 'luxon';

import { timeUnits } from '@/constants/time';
import { IndexerHistoricalBlockTradingReward } from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

import { BlockTradingReward } from '../types/summaryTypes';

const NO_CREATED_AT_HEIGHT_SPECIAL_STRING = '______UNUSED_CREATED_AT_HEIGHT______';

function createZeroBlockTradingReward(timestamp: number): IndexerHistoricalBlockTradingReward[] {
  return [
    {
      createdAtHeight: NO_CREATED_AT_HEIGHT_SPECIAL_STRING,
      createdAt: DateTime.fromMillis(timestamp).toISO()!,
      tradingReward: '0',
    },
  ];
}

export function calculateBlockRewards(
  tradingRewards: IndexerHistoricalBlockTradingReward[] | undefined,
  shimAllDates?: boolean
) {
  // Group Daily
  const rewardsKeyedByDay = groupBy(
    tradingRewards,
    ({ createdAt }) => DateTime.fromISO(createdAt).toFormat('yyyy-MM-dd') // Group by day using local timezone
  );

  // Add all dates from the first to the last date
  if (shimAllDates) {
    const earliestEvent = tradingRewards?.at(-1)?.createdAt;
    const latestEvent = tradingRewards?.at(0)?.createdAt;

    if (earliestEvent && latestEvent) {
      const startMs = new Date(earliestEvent).getTime();
      const endMs = new Date(latestEvent).getTime();
      let toSet = startMs + timeUnits.day;

      while (toSet > startMs && toSet < endMs) {
        const key = DateTime.fromMillis(toSet).toFormat('yyyy-MM-dd');
        if (!rewardsKeyedByDay[key]) {
          // Add a dummy entry if date has no trading reward events
          rewardsKeyedByDay[key] = createZeroBlockTradingReward(toSet);
        }

        toSet += timeUnits.day;
      }
    }
  }

  // Sort by descending date so we can properly calculate cumulative amount
  const rewardsByDay = orderBy(
    objectEntries(rewardsKeyedByDay),
    [([createdAt]) => new Date(createdAt).getTime()],
    ['desc']
  );

  const dailyRewards = rewardsByDay.map(([createdAt, rewardsArr]) => ({
    createdAt,
    tradingRewardBN: rewardsArr.reduce(
      (acc, { tradingReward }) => acc.plus(tradingReward),
      BIG_NUMBERS.ZERO
    ),
  }));

  // Calculate cumulative amount
  return [...dailyRewards]
    .reverse() // Reverse so that we start cumulation from the earliest date
    .reduce((acc: BlockTradingReward[], { createdAt, tradingRewardBN }) => {
      const last = acc.at(-1);
      const cumulativeAmount = tradingRewardBN
        .plus(last?.cumulativeAmount ?? BIG_NUMBERS.ZERO)
        .toNumber();

      acc.push({
        amount: tradingRewardBN.toNumber(),
        cumulativeAmount,
        startedAtInMilliseconds: DateTime.fromISO(createdAt).startOf('day').toMillis(),
        endedAtInMilliseconds: DateTime.fromISO(createdAt).endOf('day').toMillis(),
      });
      return acc;
    }, [])
    .reverse(); // Reverse back to original order
}
