import { UseQueryResult } from '@tanstack/react-query';

import { type RootState, type RootStore } from '@/state/_store';

import { log } from '@/lib/telemetry';

import { sleep } from './timeUtils';

export function wrapAndLogError<T>(
  fn: () => Promise<T>,
  logId: string,
  // Usually we rethrow the error. If this is true, we swallow the error and return undefined.
  errorReturnUndefined?: boolean
): () => Promise<T | undefined> {
  return async () => {
    try {
      return await fn();
    } catch (e) {
      log(logId, e);

      if (errorReturnUndefined) {
        return undefined;
      }
      throw e;
    }
  };
}

// it's illegal to return undefined from use query so we just wrap results in a data object
export function wrapNullable<T>(data: T | undefined): { data: T | undefined } {
  return { data };
}

export function mapNullableQueryResult<T>(
  res: Omit<UseQueryResult<{ data: T }>, 'refetch'>
): Omit<UseQueryResult<T | undefined>, 'refetch' | 'promise'> {
  return {
    ...res,
    data: res.data?.data,
  };
}

export function promiseWithTimeout<T>(
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

export function waitForSelector<T>(
  store: RootStore,
  selector: (state: RootState) => T | null | undefined,
  timeoutMs: number = 10000,
  errorMessage: string = 'Selector timed out'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const initialValue = selector(store.getState());
    if (initialValue != null) {
      resolve(initialValue);
      return;
    }

    let timeoutId: NodeJS.Timeout | undefined;

    const unsubscribe = store.subscribe(() => {
      const value = selector(store.getState());
      if (value != null) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(value);
      }
    });

    timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options = { maxRetries: 3, initialDelay: 1000 }
): Promise<T> {
  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await operation();
    } catch (error) {
      if (attempt < options.maxRetries) {
        const delay = options.initialDelay * 2 ** attempt;
        // eslint-disable-next-line no-await-in-loop
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed to complete operation - this should be unreachable');
}
