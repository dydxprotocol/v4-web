import { IndexerCompositeFillObject } from '@/types/indexer/indexerManual';
import { keyBy, maxBy, orderBy } from 'lodash';

import { EMPTY_ARR } from '@/constants/objects';

import { MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';

export function calculateFills(
  liveFills: IndexerCompositeFillObject[] | undefined,
  restFills: IndexerCompositeFillObject[] | undefined
) {
  const getFillsById = (data: IndexerCompositeFillObject[]) => keyBy(data, (fill) => fill.id ?? '');
  const merged = mergeObjects(
    getFillsById(liveFills ?? EMPTY_ARR),
    getFillsById(restFills ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
  return orderBy(Object.values(merged), [(f) => f.createdAtHeight], ['desc']);
}
