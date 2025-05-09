import { IndexerParentSubaccountTransferResponse } from '@/types/indexer/indexerApiGen';
import { isParentSubaccountTransferResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountTransfersRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpTransfersQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'transfers']);

  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    name: 'transfers',
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'transfers', data],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null) {
        return null;
      }
      return async () => {
        try {
          return await indexerClient.account.getParentSubaccountNumberTransfers(
            data.wallet!,
            data.subaccount!
          );
        } catch (e) {
          if (
            e?.message != null &&
            e?.message.indexOf('404') >= 0 &&
            e.message.indexOf('No subaccount found with address') >= 0
          ) {
            const res: IndexerParentSubaccountTransferResponse = { transfers: [] };
            return res;
          }
          throw e;
        }
      };
    },
    onResult: (transfers) => {
      store.dispatch(
        setAccountTransfersRaw(
          mapLoadableData(queryResultToLoadable(transfers), isParentSubaccountTransferResponse)
        )
      );
    },
    onNoQuery: () => store.dispatch(setAccountTransfersRaw(loadableIdle())),
  });

  return () => {
    cleanupListener();
    cleanupEffect();
    store.dispatch(setAccountTransfersRaw(loadableIdle()));
  };
}
