import { CompositeClient, IndexerClient } from '@dydxprotocol/v4-client-js';

import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { HeightEntry, setIndexerHeightRaw, setValidatorHeightRaw } from '@/state/raw';

import { assertNever } from '@/lib/assertNever';
import { promiseWithTimeout } from '@/lib/asyncUtils';
import { MustBigNumber } from '@/lib/numbers';

import {
  Loadable,
  loadableError,
  loadableIdle,
  loadableLoaded,
  loadablePending,
} from '../lib/loadable';
import {
  createIndexerQueryStoreEffect,
  createValidatorQueryStoreEffect,
} from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

const requestFrequency = timeUnits.second * 10;
// fail request if it takes longer than this
const requestTimeout = requestFrequency - timeUnits.second;

const heightPollingOptions = {
  refetchInterval: timeUnits.second * 10,
  refetchIntervalInBackground: false,
  networkMode: 'online' as const,
  staleTime: 0,
  retry: 0,
  gcTime: timeUnits.second * 10,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: false,
};

const doIndexerHeightQuery = async (
  indexerClient: IndexerClient
): Promise<Loadable<HeightEntry>> => {
  const requestTime = new Date().toISOString();
  try {
    const result = await promiseWithTimeout(indexerClient.utility.getHeight(), requestTimeout);
    return loadableLoaded({
      requestTime,
      receivedTime: new Date().toISOString(),
      response: { time: result.time, height: MustBigNumber(result.height).toNumber() },
    });
  } catch (e) {
    return loadableError(
      { requestTime, receivedTime: new Date().toISOString(), response: undefined },
      e
    );
  }
};

const collapseLoadables = <T extends { requestTime: string; receivedTime: string }>(
  obj: Loadable<Loadable<T>>
): Loadable<T> => {
  if (obj.status === 'error') {
    return loadableError(obj.data?.data, obj.error);
  }
  if (obj.status === 'idle') {
    return loadableIdle();
  }
  if (obj.status === 'pending') {
    return loadablePending();
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (obj.status === 'success') {
    return obj.data;
  }
  assertNever(obj);
  return loadableIdle();
};

export function setUpIndexerHeightQuery(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: () => true,
    getQueryFn: (indexerClient) => {
      return () => doIndexerHeightQuery(indexerClient);
    },
    onNoQuery: () => store.dispatch(setIndexerHeightRaw(loadableIdle())),
    onResult: (result) =>
      store.dispatch(setIndexerHeightRaw(collapseLoadables(queryResultToLoadable(result)))),
    getQueryKey: () => ['indexerHeight'],
    ...heightPollingOptions,
  });

  return () => {
    cleanupEffect();
    store.dispatch(setIndexerHeightRaw(loadableIdle()));
  };
}

const doValidatorHeightQuery = async (
  compositeClient: CompositeClient
): Promise<Loadable<HeightEntry>> => {
  const requestTime = new Date().toISOString();
  try {
    const result = await promiseWithTimeout(
      compositeClient.validatorClient.get.latestBlock(),
      requestTimeout
    );
    return loadableLoaded({
      requestTime,
      receivedTime: new Date().toISOString(),
      response: {
        time: result.header.time,
        height: result.header.height,
      },
    });
  } catch (e) {
    return loadableError(
      { requestTime, receivedTime: new Date().toISOString(), response: undefined },
      e
    );
  }
};

export function setUpValidatorHeightQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    selector: () => true,
    getQueryFn: (compositeClient) => {
      return () => doValidatorHeightQuery(compositeClient);
    },
    onNoQuery: () => store.dispatch(setValidatorHeightRaw(loadableIdle())),
    onResult: (res) =>
      store.dispatch(setValidatorHeightRaw(collapseLoadables(queryResultToLoadable(res)))),
    getQueryKey: () => ['validatorHeight'],
    ...heightPollingOptions,
  });

  return () => {
    cleanupEffect();
    store.dispatch(setValidatorHeightRaw(loadableIdle()));
  };
}
