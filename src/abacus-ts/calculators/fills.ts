import { IndexerCompositeFillObject } from '@/types/indexer/indexerManual';
import { keyBy, maxBy } from 'lodash';

import { MustBigNumber } from '@/lib/numbers';

import { Loadable } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { mergeObjects } from '../lib/mergeObjects';

export function calculateFills(
  liveFills: Loadable<IndexerCompositeFillObject[]>,
  restFills: Loadable<IndexerCompositeFillObject[]>
) {
  const getFillsById = (data: Loadable<IndexerCompositeFillObject[]>) =>
    mapLoadableData(data, (d) => keyBy(d, (fill) => fill.id ?? ''));
  return mergeObjects(
    getFillsById(liveFills).data ?? {},
    getFillsById(restFills).data ?? {},
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
}
