import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setIndexerHeightRaw, setValidatorHeightRaw } from '@/state/raw';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import {
  createIndexerQueryStoreEffect,
  createValidatorQueryStoreEffect,
} from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpIndexerHeightQuery(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: () => true,
    getQueryKey: () => ['height'],
    getQueryFn: (indexerClient) => {
      return () => indexerClient.utility.getHeight();
    },
    onResult: (height) => {
      store.dispatch(setIndexerHeightRaw(queryResultToLoadable(height)));
    },
    onNoQuery: () => store.dispatch(setIndexerHeightRaw(loadableIdle())),
    refetchInterval: timeUnits.second * 10,
    staleTime: timeUnits.second * 10,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setIndexerHeightRaw(loadableIdle()));
  };
}

export function setUpValidatorHeightQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    selector: () => true,
    getQueryKey: () => ['height'],
    getQueryFn: (compositeClient) => {
      return () => compositeClient.validatorClient.get.latestBlock();
    },
    onResult: (height) => {
      store.dispatch(
        setValidatorHeightRaw(
          mapLoadableData(queryResultToLoadable(height), (d) => ({
            height: d.header.height,
            time: d.header.time,
          }))
        )
      );
    },
    onNoQuery: () => store.dispatch(setValidatorHeightRaw(loadableIdle())),
    refetchInterval: timeUnits.second * 10,
    staleTime: timeUnits.second * 10,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setValidatorHeightRaw(loadableIdle()));
  };
}
