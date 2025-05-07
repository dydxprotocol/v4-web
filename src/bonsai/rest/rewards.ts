import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setRewardsParams, setRewardsTokenPrice } from '@/state/raw';

import { parseToPrimitives } from '@/lib/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

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
