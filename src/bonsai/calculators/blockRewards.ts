import { keyBy, maxBy } from 'lodash';

import { IndexerHistoricalBlockTradingReward } from '@/types/indexer/indexerApiGen';

import { MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';

export function calculateBlockRewards(
  liveBlockRewards: IndexerHistoricalBlockTradingReward[] | undefined,
  restBlockRewards: IndexerHistoricalBlockTradingReward[] | undefined
) {
  const getRewardsById = (data: IndexerHistoricalBlockTradingReward[] | undefined) =>
    data != null ? keyBy(data, (reward) => reward.createdAtHeight) : undefined;

  return Object.values(
    mergeObjects(
      getRewardsById(liveBlockRewards) ?? {},
      getRewardsById(restBlockRewards) ?? {},
      (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
    )
  );
}
