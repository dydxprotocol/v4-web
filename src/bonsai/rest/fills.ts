import { isParentSubaccountFillResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountFillsRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpFillsQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'fills']);
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'fills', data.wallet, data.subaccount],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null) {
        return null;
      }
      return () =>
        indexerClient.account.getParentSubaccountNumberFills(data.wallet!, data.subaccount!);
    },
    onResult: (fills) => {
      store.dispatch(
        setAccountFillsRaw(
          mapLoadableData(queryResultToLoadable(fills), isParentSubaccountFillResponse)
        )
      );
    },
    onNoQuery: () => store.dispatch(setAccountFillsRaw(loadableIdle())),
  });
  return () => {
    cleanupListener();
    cleanupEffect();
    store.dispatch(setAccountFillsRaw(loadableIdle()));
  };
}
