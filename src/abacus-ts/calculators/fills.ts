import { IndexerCompositeFillObject } from '@/types/indexer/indexerManual';
import { keyBy, maxBy } from 'lodash';

import { EMPTY_ARR } from '@/constants/objects';

import { MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';

export function calculateFills(
  liveFills: IndexerCompositeFillObject[] | undefined,
  restFills: IndexerCompositeFillObject[] | undefined
) {
  const getFillsById = (data: IndexerCompositeFillObject[]) => keyBy(data, (fill) => fill.id ?? '');
  return mergeObjects(
    getFillsById(liveFills ?? EMPTY_ARR),
    getFillsById(restFills ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
}
