import { NOBLE_USDC_DENOM } from '@/constants/denoms';
import { timeUnits } from '@/constants/time';

import type { RootStore } from '@/state/_store';
import { setAccountNobleUsdcBalanceRaw } from '@/state/raw';

import { loadableIdle } from '../lib/loadable';
import { selectAccountNobleWalletAddress } from '../selectors/account';
import { createNobleQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpNobleBalanceQuery(store: RootStore) {
  const cleanUpEffect = createNobleQueryStoreEffect(store, {
    name: 'nobleBalance',
    selector: selectAccountNobleWalletAddress,
    getQueryKey: (data) => ['nobleBalances', data],
    getQueryFn: (nobleClient, data) => {
      if (data == null) {
        return null;
      }

      return () => nobleClient.getBalance(data, NOBLE_USDC_DENOM);
    },
    onResult: (result) => {
      store.dispatch(setAccountNobleUsdcBalanceRaw(queryResultToLoadable(result)));
    },
    onNoQuery: () => store.dispatch(setAccountNobleUsdcBalanceRaw(loadableIdle())),
    refetchInterval: timeUnits.minute,
    staleTime: timeUnits.minute,
  });

  return () => {
    cleanUpEffect();
    store.dispatch(setAccountNobleUsdcBalanceRaw(loadableIdle()));
  };
}
