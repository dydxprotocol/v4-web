import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setAccountBalancesRaw, setAccountFeeTierRaw, setAccountStatsRaw } from '@/state/raw';

import { parseToPrimitives } from '@/lib/abacus/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
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
            return parseToPrimitives(data);
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

export function setUpAccountFeeTierQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['userFeeTier', data.wallet],
    getQueryFn: (compositeClient, data) => {
      if (data.wallet == null) {
        return null;
      }
      return () => compositeClient.validatorClient.get.getUserFeeTier(data.wallet!);
    },
    onResult: (result) => {
      store.dispatch(
        setAccountFeeTierRaw(
          mapLoadableData(queryResultToLoadable(result), (d) => parseToPrimitives(d).tier)
        )
      );
    },
    onNoQuery: () => store.dispatch(setAccountFeeTierRaw(loadableIdle())),
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setAccountFeeTierRaw(loadableIdle()));
  };
}
