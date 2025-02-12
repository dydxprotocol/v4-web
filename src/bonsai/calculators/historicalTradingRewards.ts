import { orderBy } from 'lodash';

import { EMPTY_ARR } from '@/constants/objects';
import { IndexerHistoricalTradingRewardAggregation } from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

export function calculateDailyCumulativeTradingRewards(
  tradingRewards?: IndexerHistoricalTradingRewardAggregation[]
) {
  if (tradingRewards == null) {
    return EMPTY_ARR;
  }

  // sort objectEntries from earliest -> latest
  const sortedRewards = orderBy(
    tradingRewards,
    [({ startedAt }) => new Date(startedAt).getTime()],
    ['asc']
  );

  // Calculate cumulative amount
  let cumulativeAmountBN = BIG_NUMBERS.ZERO;

  return sortedRewards.map(({ startedAt, tradingReward }) => {
    const tradingRewardBN = MustBigNumber(tradingReward);
    cumulativeAmountBN = cumulativeAmountBN.plus(tradingRewardBN);

    return {
      date: new Date(startedAt).getTime(),
      amount: tradingRewardBN.toNumber(),
      cumulativeAmount: cumulativeAmountBN.toNumber(),
    };
  });
}
