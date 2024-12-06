import { type RootStore } from '@/state/_store';
import { setAccountFillsRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../loadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './indexerQueryStoreEffect';

export function setUpFillsQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'fills']);
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'fills', data.wallet, data.subaccount],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null) {
        if (store.getState().raw.account.fills.data != null) {
          store.dispatch(setAccountFillsRaw(loadableIdle()));
        }
        return null;
      }
      return () =>
        indexerClient.account.getParentSubaccountNumberFills(data.wallet!, data.subaccount!);
    },
    onResult: (fills) => {
      store.dispatch(
        setAccountFillsRaw({
          status: fills.status,
          data: fills.data,
          error: fills.error,
        })
      );
    },
  });
  return () => {
    cleanupListener();
    cleanupEffect();
  };
}
