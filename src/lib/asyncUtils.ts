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
