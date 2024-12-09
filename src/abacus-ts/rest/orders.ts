import { isParentSubaccountOrders } from '@/types/indexer/indexerChecks';
import { keyBy } from 'lodash';

import { type RootStore } from '@/state/_store';
import { setAccountOrdersRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../loadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './indexerQueryStoreEffect';

export function setUpOrdersQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'orders']);
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'orders', data.wallet, data.subaccount],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null) {
        if (store.getState().raw.account.orders.data != null) {
          store.dispatch(setAccountOrdersRaw(loadableIdle()));
        }
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
  });
  return () => {
    cleanupListener();
    cleanupEffect();
  };
}
