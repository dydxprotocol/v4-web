import { isParentSubaccountTransferResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountTransfersRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';

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
        setAccountTransfersRaw({
          status: transfers.status,
          data:
            transfers.data != null
              ? isParentSubaccountTransferResponse(transfers.data)
              : transfers.data,
          error: transfers.error,
        })
      );
    },
  });

  return () => {
    cleanupListener();
    cleanupEffect();
    store.dispatch(setAccountTransfersRaw(loadableIdle()));
  };
}