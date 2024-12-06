import { type RootStore } from '@/state/_store';
import { setAccountBlockTradingRewardsRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../loadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './indexerQueryStoreEffect';

export function setUpBlockTradingRewardsQuery(store: RootStore) {
  const cleanupListener = refreshIndexerQueryOnAccountSocketRefresh([
    'account',
    'blockTradingRewards',
  ]);

  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['account', 'blockTradingRewards', data],
    getQueryFn: (indexerClient, data) => {
      if (!isTruthy(data.wallet) || data.subaccount == null) {
        if (store.getState().raw.account.blockTradingRewards.data != null) {
          store.dispatch(setAccountBlockTradingRewardsRaw(loadableIdle()));
        }
        return null;
      }
      return () => indexerClient.account.getHistoricalBlockTradingRewards(data.wallet!);
    },
    onResult: (blockTradingRewards) => {
      store.dispatch(
        setAccountBlockTradingRewardsRaw({
          status: blockTradingRewards.status,
          data: blockTradingRewards.data,
          error: blockTradingRewards.error,
        })
      );
    },
  });

  return () => {
    cleanupListener();
    cleanupEffect();
  };
}
