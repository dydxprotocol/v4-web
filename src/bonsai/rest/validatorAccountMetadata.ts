import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import {
  setAccountBalancesRaw,
  setAccountFeeTierRaw,
  setAccountStatsRaw,
  setRewardsParams,
  setRewardsTokenPrice,
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

export function setUpRewardsParamsQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'rewardsParams',
    selector: () => true,
    getQueryKey: () => ['rewardsParams'],
    getQueryFn: (compositeClient) => {
      return () => compositeClient.validatorClient.get.getRewardsParams();
    },
    onResult: (result) => {
      store.dispatch(
        setRewardsParams(
          mapLoadableData(queryResultToLoadable(result), (d) => parseToPrimitives(d).params)
        )
      );
    },
    onNoQuery: () => store.dispatch(setRewardsParams(loadableIdle())),
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setRewardsParams(loadableIdle()));
  };
}

export function setUpRewardsTokenPriceQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'rewardsParamsTokenPrice',
    selector: (state) => state.raw.rewards.data.data?.marketId,
    getQueryKey: (market) => ['rewardsParamsTokenPrice', market],
    getQueryFn: (compositeClient, market) => {
      if (market == null) {
        return null;
      }
      return () => compositeClient.validatorClient.get.getPrice(market);
    },
    onResult: (result) => {
      store.dispatch(
        setRewardsTokenPrice(
          mapLoadableData(queryResultToLoadable(result), (d) => parseToPrimitives(d).marketPrice)
        )
      );
    },
    onNoQuery: () => store.dispatch(setRewardsTokenPrice(loadableIdle())),
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setRewardsTokenPrice(loadableIdle()));
  };
}
