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

// fetch every ten seconds no matter what...could probably just set up a setInterval instead
const heightPollingOptions = {
  refetchInterval: timeUnits.second * 10,
  refetchIntervalInBackground: true,
  retry: 0,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

export function setUpIndexerHeightQuery(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: () => true,
    getQueryKey: () => ['indexerHeight'],
    getQueryFn: (indexerClient) => {
      return () => indexerClient.utility.getHeight();
    },
    onResult: (height) => {
      store.dispatch(setIndexerHeightRaw(queryResultToLoadable(height)));
    },
    onNoQuery: () => store.dispatch(setIndexerHeightRaw(loadableIdle())),
    ...heightPollingOptions,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setIndexerHeightRaw(loadableIdle()));
  };
}

export function setUpValidatorHeightQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    selector: () => true,
    getQueryKey: () => ['validatorHeight'],
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
    ...heightPollingOptions,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setValidatorHeightRaw(loadableIdle()));
  };
}
