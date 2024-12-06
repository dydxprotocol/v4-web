import { keyBy } from 'lodash';

import { type RootStore } from '@/state/_store';
import { getUserSubaccountNumber, getUserWalletAddress } from '@/state/accountSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setAccountOrdersRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../loadable';
import { createIndexerQueryStoreEffect } from './indexerQueryStoreEffect';

export function setUpOrdersQuery(store: RootStore) {
  const selectParentSubaccountInfo = createAppSelector(
    getUserWalletAddress,
    getUserSubaccountNumber,
    (wallet, subaccount) => ({ wallet, subaccount })
  );

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
          data: orders.data != null ? keyBy(orders.data, (o) => o.id ?? '') : orders.data,
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
