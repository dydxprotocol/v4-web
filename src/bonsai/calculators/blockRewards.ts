import { keyBy, maxBy } from 'lodash';

import { IndexerHistoricalBlockTradingReward } from '@/types/indexer/indexerApiGen';

import { MustBigNumber } from '@/lib/numbers';

import { Loadable } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { mergeObjects } from '../lib/mergeObjects';

export function calculateBlockRewards(
  liveTransfers: Loadable<IndexerHistoricalBlockTradingReward[]>,
  restTransfers: Loadable<IndexerHistoricalBlockTradingReward[]>
) {
  const getRewardsById = (data: Loadable<IndexerHistoricalBlockTradingReward[]>) =>
    mapLoadableData(data, (d) => keyBy(d, (reward) => reward.createdAtHeight));
  return mergeObjects(
    getRewardsById(liveTransfers).data ?? {},
    getRewardsById(restTransfers).data ?? {},
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
}
