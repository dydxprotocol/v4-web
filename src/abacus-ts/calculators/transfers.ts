import { IndexerTransferResponseObject } from '@/types/indexer/indexerApiGen';
import { keyBy, maxBy } from 'lodash';

import { EMPTY_ARR } from '@/constants/objects';

import { MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';

export function calculateTransfers(
  liveTransfers: IndexerTransferResponseObject[] | undefined,
  restTransfers: IndexerTransferResponseObject[] | undefined
) {
  const getTransfersById = (data: IndexerTransferResponseObject[]) =>
    keyBy(data, (transfer) => transfer.id);
  return mergeObjects(
    getTransfersById(liveTransfers ?? EMPTY_ARR),
    getTransfersById(restTransfers ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
}
