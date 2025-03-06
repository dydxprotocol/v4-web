import { UseQueryResult } from '@tanstack/react-query';

import { log } from '@/lib/telemetry';

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
): Omit<UseQueryResult<T | undefined>, 'refetch'> {
  return { ...res, data: res.data?.data };
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
