import { MEGAVAULT_MODULE_ADDRESS } from '@dydxprotocol/v4-client-js';
import { keyBy, maxBy } from 'lodash';

import { EMPTY_ARR } from '@/constants/objects';
import { IndexerTransferType } from '@/types/indexer/indexerApiGen';
import { IndexerTransferCommonResponseObject } from '@/types/indexer/indexerManual';

import { MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';

export function calculateTransfers(
  liveTransfers: IndexerTransferCommonResponseObject[] | undefined,
  restTransfers: IndexerTransferCommonResponseObject[] | undefined,
  accountAddress: string | undefined
) {
  // TODO had to switch to keying by transaction hash, we should switch back when indexer is fixed
  const getTransfersById = (data: IndexerTransferCommonResponseObject[] | undefined) =>
    keyBy(processTransfers(data, accountAddress), (transfer) => transfer.transactionHash);
  return mergeObjects(
    getTransfersById(liveTransfers ?? EMPTY_ARR),
    getTransfersById(restTransfers ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
}

function processTransfers(
  transfers: IndexerTransferCommonResponseObject[] | undefined,
  accountAddress: string | undefined
) {
  return (transfers ?? EMPTY_ARR)
    .filter(
      (t) =>
        t.recipient.address !== MEGAVAULT_MODULE_ADDRESS &&
        t.sender.address !== MEGAVAULT_MODULE_ADDRESS
    )
    .map((t) => ({
      ...t,
      type:
        t.type === IndexerTransferType.WITHDRAWAL &&
        t.recipient.address !== accountAddress &&
        accountAddress != null
          ? IndexerTransferType.TRANSFEROUT
          : t.type,
    }));
}
