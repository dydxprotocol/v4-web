import { keyBy } from 'lodash';

import { isParentSubaccountOrders } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountOrdersRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';

export function setUpOrdersQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'orders']);
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'orders', data.wallet, data.subaccount],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null) {
        return null;
      }
      return () =>
        indexerClient.account.getParentSubaccountNumberOrders(
          data.wallet!,
          data.subaccount!,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          true
        );
    },
    onResult: (orders) => {
      store.dispatch(
        setAccountOrdersRaw({
          status: orders.status,
          data:
            orders.data != null
              ? keyBy(isParentSubaccountOrders(orders.data), (o) => o.id ?? '')
              : orders.data,
          error: orders.error,
        })
      );
    },
    onNoQuery: () => store.dispatch(setAccountOrdersRaw(loadableIdle())),
  });
  return () => {
    cleanupListener();
    cleanupEffect();
    store.dispatch(setAccountOrdersRaw(loadableIdle()));
  };
}
