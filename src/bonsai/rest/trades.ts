import { isParentSubaccountTradeResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountTradesRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpTradesQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'trades']);
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    name: 'trades',
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'trades', data.wallet, data.subaccount],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null || data.isPerpsGeoRestricted) {
        return null;
      }
      // TODO: DWJ -- Replace with real trades endpoint when available
      // e.g. indexerClient.account.getParentSubaccountNumberTrades(data.wallet!, data.subaccount!)
      return () =>
        indexerClient.account.getParentSubaccountNumberFills(data.wallet!, data.subaccount!);
    },
    onResult: (trades) => {
      store.dispatch(
        setAccountTradesRaw(
          mapLoadableData(queryResultToLoadable(trades), isParentSubaccountTradeResponse)
        )
      );
    },
    onNoQuery: () => store.dispatch(setAccountTradesRaw(loadableIdle())),
  });
  return () => {
    cleanupListener();
    cleanupEffect();
    store.dispatch(setAccountTradesRaw(loadableIdle()));
  };
}
