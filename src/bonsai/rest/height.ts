import { CompositeClient, IndexerClient } from '@dydxprotocol/v4-client-js';
import { omit } from 'lodash';

import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import {
  GeoHeaders,
  HeightEntry,
  setComplianceGeoHeadersRaw,
  setIndexerHeightRaw,
  setValidatorHeightRaw,
} from '@/state/raw';

import { assertNever } from '@/lib/assertNever';
import { promiseWithTimeout, withRetry } from '@/lib/asyncUtils';
import { MustBigNumber } from '@/lib/numbers';

import {
  Loadable,
  loadableError,
  loadableIdle,
  loadableLoaded,
  loadablePending,
} from '../lib/loadable';
import { SharedLogIds } from '../logIds';
import { wrapAndLogBonsaiError } from '../logs';
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

const manualHeightRetryConfig = { initialDelay: 500, maxRetries: 1 };

// Internal type that includes geo data before it's extracted and stored separately
type IndexerHeightEntry = HeightEntry & {
  geo?: Omit<GeoHeaders, 'lastUpdated'>;
};

const doIndexerHeightQuery = async (
  indexerClient: IndexerClient
): Promise<Loadable<IndexerHeightEntry>> => {
  const requestTime = new Date().toISOString();
  try {
    const result = await promiseWithTimeout(
      withRetry(
        () =>
          wrapAndLogBonsaiError(
            () => indexerClient.utility.getHeightWithHeaders(),
            SharedLogIds.INDEXER_HEIGHT_INNER
          )(),
        manualHeightRetryConfig
      ),
      requestTimeout
    );

    return loadableLoaded({
      requestTime,
      receivedTime: new Date().toISOString(),
      response: { time: result.data.time, height: MustBigNumber(result.data.height).toNumber() },
      geo: {
        status: result.headers['geo-origin-status'],
        region: result.headers['geo-origin-region'],
        country: result.headers['geo-origin-country'],
      },
    });
  } catch (e) {
    return loadableError(
      {
        requestTime,
        receivedTime: new Date().toISOString(),
        response: undefined,
        geo: undefined,
      },
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
    name: SharedLogIds.INDEXER_HEIGHT,
    selector: () => true,
    getQueryFn: (indexerClient) => {
      return () => doIndexerHeightQuery(indexerClient);
    },
    onNoQuery: () => store.dispatch(setIndexerHeightRaw(loadableIdle())),
    onResult: (result) => {
      const collapsed = collapseLoadables(queryResultToLoadable(result));

      if (collapsed.status === 'success' && collapsed.data.geo) {
        store.dispatch(setComplianceGeoHeadersRaw(loadableLoaded(collapsed.data.geo)));

        // Remove geo from the height entry before storing
        const heightWithoutGeo = omit(collapsed.data, ['geo']);
        store.dispatch(
          setIndexerHeightRaw({
            ...collapsed,
            data: heightWithoutGeo,
          })
        );
      } else {
        // Dispatch as-is if no geo data (error case)
        store.dispatch(setIndexerHeightRaw(collapsed));
      }
    },
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
      withRetry(
        () =>
          wrapAndLogBonsaiError(
            () => compositeClient.validatorClient.get.latestBlock(),
            SharedLogIds.VALIDATOR_HEIGHT_INNER
          )(),
        manualHeightRetryConfig
      ),
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
    name: SharedLogIds.VALIDATOR_HEIGHT,
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
