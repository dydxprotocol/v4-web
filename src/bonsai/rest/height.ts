import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { HeightEntry, setIndexerHeightRaw, setValidatorHeightRaw } from '@/state/raw';

import { MustBigNumber } from '@/lib/numbers';

import {
  Loadable,
  loadableError,
  loadableIdle,
  loadableLoaded,
  loadablePending,
} from '../lib/loadable';
import {
  createIndexerStoreEffect,
  createValidatorStoreEffect,
} from './lib/indexerQueryStoreEffect';

const requestFrequency = timeUnits.second * 10;
// fail request if it takes longer than this
const requestTimeout = requestFrequency - timeUnits.second;

export function setUpIndexerHeightQuery(store: RootStore) {
  const cleanupEffect = createIndexerStoreEffect(store, {
    selector: () => true,
    handleNoClient: () => store.dispatch(setIndexerHeightRaw(loadableIdle())),
    handle: (_, indexerClient) => {
      const doRequest = async (): Promise<Loadable<HeightEntry>> => {
        const requestTime = new Date().toISOString();
        try {
          const result = await promiseWithTimeout(
            indexerClient.utility.getHeight(),
            requestTimeout
          );
          return loadableLoaded({
            requestTime,
            response: { time: result.time, height: MustBigNumber(result.height).toNumber() },
          });
        } catch (e) {
          return loadableError({ requestTime, response: undefined }, e);
        }
      };

      const interval = setInterval(async () => {
        store.dispatch(
          setIndexerHeightRaw(
            loadablePending(store.getState().raw.heights.indexerHeight.latest.data)
          )
        );
        store.dispatch(setIndexerHeightRaw(await doRequest()));
      }, requestFrequency);

      return () => {
        clearInterval(interval);
      };
    },
  });

  return () => {
    cleanupEffect();
    store.dispatch(setIndexerHeightRaw(loadableIdle()));
  };
}

export function setUpValidatorHeightQuery(store: RootStore) {
  const cleanupEffect = createValidatorStoreEffect(store, {
    selector: () => true,
    handleNoClient: () => store.dispatch(setValidatorHeightRaw(loadableIdle())),
    handle: (_, compositeClient) => {
      const doRequest = async (): Promise<Loadable<HeightEntry>> => {
        const requestTime = new Date().toISOString();
        try {
          const result = await promiseWithTimeout(
            compositeClient.validatorClient.get.latestBlock(),
            requestTimeout
          );
          return loadableLoaded({
            requestTime,
            response: {
              time: result.header.time,
              height: result.header.height,
            },
          });
        } catch (e) {
          return loadableError({ requestTime, response: undefined }, e);
        }
      };

      const interval = setInterval(async () => {
        store.dispatch(
          setValidatorHeightRaw(
            loadablePending(store.getState().raw.heights.validatorHeight.latest.data)
          )
        );
        store.dispatch(setValidatorHeightRaw(await doRequest()));
      }, requestFrequency);

      return () => {
        clearInterval(interval);
      };
    },
  });

  return () => {
    cleanupEffect();
    store.dispatch(setValidatorHeightRaw(loadableIdle()));
  };
}

function promiseWithTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}
