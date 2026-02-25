import { isParentSubaccountTradeHistoryResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountTradesRaw } from '@/state/raw';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpTradeHistoryQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh(['account', 'tradeHistory']);
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    name: 'tradeHistory',
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'tradeHistory', data.wallet, data.subaccount],
    getQueryFn: (indexerClient, { wallet, subaccount, isPerpsGeoRestricted }) => {
      if (wallet == null || subaccount == null || isPerpsGeoRestricted) {
        return null;
      }
      return () =>
        indexerClient.account.getParentSubaccountNumberTradeHistory(
          wallet,
          subaccount,
          undefined,
          undefined,
          undefined,
          undefined
        );
    },
    onResult: (tradeHistory) => {
      store.dispatch(
        setAccountTradesRaw(
          mapLoadableData(
            queryResultToLoadable(tradeHistory),
            isParentSubaccountTradeHistoryResponse
          )
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
