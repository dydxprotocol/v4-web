import { isParentSubaccountBlockRewardResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAccountBlockTradingRewardsRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { refreshIndexerQueryOnAccountSocketRefresh } from '../accountRefreshSignal';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

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
        setAccountBlockTradingRewardsRaw(
          mapLoadableData(
            queryResultToLoadable(blockTradingRewards),
            isParentSubaccountBlockRewardResponse
          )
        )
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
