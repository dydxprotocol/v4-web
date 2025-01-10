import { keyBy, maxBy } from 'lodash';

import { EMPTY_ARR } from '@/constants/objects';
import { IndexerTransferCommonResponseObject } from '@/types/indexer/indexerManual';

import { MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';

export function calculateTransfers(
  liveTransfers: IndexerTransferCommonResponseObject[] | undefined,
  restTransfers: IndexerTransferCommonResponseObject[] | undefined
) {
  // TODO had to switch to keying by transaction hash, we should switch back when indexer is fixed
  const getTransfersById = (data: IndexerTransferCommonResponseObject[]) =>
    keyBy(data, (transfer) => transfer.transactionHash);
  return mergeObjects(
    getTransfersById(liveTransfers ?? EMPTY_ARR),
    getTransfersById(restTransfers ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
}
