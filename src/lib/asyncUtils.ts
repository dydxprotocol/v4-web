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
