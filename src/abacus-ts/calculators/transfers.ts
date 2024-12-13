import { IndexerTransferResponseObject } from '@/types/indexer/indexerApiGen';
import { keyBy, maxBy } from 'lodash';

import { MustBigNumber } from '@/lib/numbers';

import { Loadable } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { mergeObjects } from '../lib/mergeObjects';

function calculateTransfers(
  liveTransfers: Loadable<IndexerTransferResponseObject[]>,
  restTransfers: Loadable<IndexerTransferResponseObject[]>
) {
  const getTransfersById = (data: Loadable<IndexerTransferResponseObject[]>) =>
    mapLoadableData(data, (d) => keyBy(d, (transfer) => transfer.id));
  return mergeObjects(
    getTransfersById(liveTransfers).data ?? {},
    getTransfersById(restTransfers).data ?? {},
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
}
