import { isParentSubaccountBlockRewardResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountBlockTradingRewardsRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';

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
        return null;
      }
      return () => indexerClient.account.getHistoricalBlockTradingRewards(data.wallet!);
    },
    onResult: (blockTradingRewards) => {
      store.dispatch(
        setAccountBlockTradingRewardsRaw({
          status: blockTradingRewards.status,
          data:
            blockTradingRewards.data != null
              ? isParentSubaccountBlockRewardResponse(blockTradingRewards.data)
              : blockTradingRewards.data,
          error: blockTradingRewards.error,
        })
      );
    },
    onNoQuery: () => store.dispatch(setAccountBlockTradingRewardsRaw(loadableIdle())),
  });

  return () => {
    cleanupListener();
    cleanupEffect();
    store.dispatch(setAccountBlockTradingRewardsRaw(loadableIdle()));
  };
}
