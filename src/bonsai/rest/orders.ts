import { keyBy } from 'lodash';

import { isParentSubaccountOrders } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountOrdersRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpOrdersQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'orders']);
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    name: 'orders',
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'orders', data.wallet, data.subaccount],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null || data.isPerpsGeoRestricted) {
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
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const recentOrders = isParentSubaccountOrders(orders.data ?? []).filter(
        (o) => o.updatedAt != null && new Date(o.updatedAt).getTime() >= tenMinutesAgo
      );
      // eslint-disable-next-line no-console
      console.log('onResult REST (last 10min)', recentOrders);
      store.dispatch(
        setAccountOrdersRaw(
          mapLoadableData(queryResultToLoadable(orders), (data) =>
            keyBy(isParentSubaccountOrders(data), (o) => o.id ?? '')
          )
        )
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
