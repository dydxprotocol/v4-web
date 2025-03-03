import { NOBLE_USDC_DENOM } from '@/constants/denoms';

import type { RootStore } from '@/state/_store';
import { setAccountNobleUsdcBalanceRaw } from '@/state/raw';

import { loadableIdle } from '../lib/loadable';
import { selectAccountNobleWalletAddress } from '../selectors/account';
import { createNobleQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpNobleBalanceQuery(store: RootStore) {
  const cleanUpEffect = createNobleQueryStoreEffect(store, {
    selector: selectAccountNobleWalletAddress,
    getQueryKey: (data) => ['nobleBalances', data],
    getQueryFn: (nobleClient, data) => {
      return () => nobleClient.getBalance(data!, NOBLE_USDC_DENOM);
    },
    onResult: (result) => {
      store.dispatch(setAccountNobleUsdcBalanceRaw(queryResultToLoadable(result)));
    },
    onNoQuery: () => store.dispatch(setAccountNobleUsdcBalanceRaw(loadableIdle())),
  });

  return () => {
    cleanUpEffect();
    store.dispatch(setAccountNobleUsdcBalanceRaw(loadableIdle()));
  };
}
