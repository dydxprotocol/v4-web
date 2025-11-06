import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import {
  setAccountBalancesRaw,
  setAccountFeeTierRaw,
  setAccountStakingTierRaw,
  setAccountStatsRaw,
} from '@/state/raw';

import { parseToPrimitives } from '@/lib/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpAccountBalancesQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'accountBalances',
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
    name: 'accountStats',
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
    name: 'accountFeeTier',
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

export function setUpAccountStakingTierQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'accountStakingTier',
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['userStakingTier', data.wallet],
    getQueryFn: (compositeClient, data) => {
      if (data.wallet == null) {
        return null;
      }
      return () => compositeClient.validatorClient.get.getUserStakingTier(data.wallet!);
    },
    onResult: (result) => {
      store.dispatch(
        setAccountStakingTierRaw(
          mapLoadableData(queryResultToLoadable(result), (d) => parseToPrimitives(d))
        )
      );
    },
    onNoQuery: () => store.dispatch(setAccountStakingTierRaw(loadableIdle())),
    // Due to computation optimization on protocol side, User's staking tier can take up to 15 min to update once they stake more tokens.
    // So we're refetching every 5 minutes to ensure the latest data is displayed.
    refetchInterval: timeUnits.minute * 5,
    staleTime: timeUnits.minute * 5,
  });
  return () => {
    cleanupEffect();
  };
}

export function setUpCompositeClientAccountCacheQuery(store: RootStore) {
  return createValidatorQueryStoreEffect(store, {
    name: 'compositeClientAccountCache',
    selector: selectParentSubaccountInfo,
    getQueryKey: (data) => ['compositeClientAccountCache', data.wallet],
    getQueryFn: (compositeClient, data) => {
      if (data.wallet == null) {
        return null;
      }
      return async () => {
        await compositeClient.populateAccountNumberCache(data.wallet!);
        return true;
      };
    },
    onResult: () => {},
    onNoQuery: () => {},
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
}
