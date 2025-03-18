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
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'transfers', data],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null) {
        return null;
      }
      return () =>
        indexerClient.account.getParentSubaccountNumberTransfers(data.wallet!, data.subaccount!);
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
