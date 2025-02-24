import { orderBy } from 'lodash';

import { EMPTY_ARR } from '@/constants/objects';
import { IndexerHistoricalTradingRewardAggregation } from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

export function calculateDailyCumulativeTradingRewards(
  tradingRewards?: IndexerHistoricalTradingRewardAggregation[]
) {
  if (tradingRewards == null || tradingRewards.length === 0) {
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

  const sortedCumulative = sortedRewards.map(({ startedAt, tradingReward }) => {
    const tradingRewardBN = MustBigNumber(tradingReward);
    cumulativeAmountBN = cumulativeAmountBN.plus(tradingRewardBN);

    return {
      date: new Date(startedAt).getTime(),
      amount: tradingRewardBN.toNumber(),
      cumulativeAmount: cumulativeAmountBN.toNumber(),
    };
  });
  if (sortedCumulative.length === 0) {
    return sortedCumulative;
  }
  const finalPoint = sortedCumulative.at(-1)!;
  const firstPoint = sortedCumulative.at(0)!;
  // add a start point and end point
  return [
    { cumulativeAmount: 0, amount: 0, date: firstPoint.date - 1000 },
    ...sortedCumulative,
    { cumulativeAmount: finalPoint.cumulativeAmount, amount: 0, date: new Date().getTime() },
  ];
}
