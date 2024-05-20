import { log } from '@/lib/telemetry';

export function wrapAndLogError<T>(fn: () => Promise<T>, logId: string): () => Promise<T> {
  return async () => {
    try {
      return await fn();
    } catch (e) {
      log(logId, e);
      throw e;
    }
  };
}
