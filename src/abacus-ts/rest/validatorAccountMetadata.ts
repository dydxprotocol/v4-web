import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setAccountBalancesRaw, setAccountStatsRaw } from '@/state/raw';

import { parseToPrimitives } from '@/lib/abacus/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { AccountStats } from '../types/summaryTypes';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpAccountBalancesQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['accountBalances', data.wallet],
    getQueryFn: (compositeClient, data) => {
      if (data.wallet == null) {
        return null;
      }
      return () => compositeClient.validatorClient.get.getAccountBalances(data.wallet!);
    },
    onResult: (result) => {
      store.dispatch(setAccountBalancesRaw(queryResultToLoadable(result)));
    },
    onNoQuery: () => store.dispatch(setAccountBalancesRaw(loadableIdle())),
    refetchInterval: timeUnits.minute,
    staleTime: timeUnits.minute,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setAccountBalancesRaw(loadableIdle()));
  };
}

export function setUpAccountStatsQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['accountStats', data.wallet],
    getQueryFn: (compositeClient, data) => {
      if (data.wallet == null) {
        return null;
      }
      return () => compositeClient.validatorClient.get.getUserStats(data.wallet!);
    },
    onResult: (result) => {
      store.dispatch(
        setAccountStatsRaw(
          mapLoadableData(queryResultToLoadable(result), (data) => {
            const parsed = parseToPrimitives(data);
            // this would be unnecessary but our version of Long is different than the composite client version so the Long doesn't duck type correctly
            return parsed as unknown as AccountStats;
          })
        )
      );
    },
    onNoQuery: () => store.dispatch(setAccountStatsRaw(loadableIdle())),
    refetchInterval: timeUnits.minute,
    staleTime: timeUnits.minute,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setAccountStatsRaw(loadableIdle()));
  };
}
