import { groupBy } from 'lodash';
import { DateTime } from 'luxon';

import { IndexerHistoricalBlockTradingReward } from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

import { BlockTradingReward } from '../types/summaryTypes';

export function calculateBlockRewards(
  tradingRewards: IndexerHistoricalBlockTradingReward[] | undefined
) {
  console.log({ new: tradingRewards });
  // Group Daily
  const rewardsKeyedByDay = groupBy(
    tradingRewards,
    ({ createdAt }) => DateTime.fromISO(createdAt).toFormat('yyyy-MM-dd') // Group by day using local timezone
  );

  const dailyRewards = objectEntries(rewardsKeyedByDay).map(([createdAt, rewardsArr]) => ({
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
