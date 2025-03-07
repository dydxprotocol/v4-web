/**
 * Creates a semaphore that allows only one request to run at a time.
 * If a new request is made while a previous request is still running, the new request will throw a SupersededError.
 * @returns A semaphore object with a run method.
 * @note Used in Bonsai lifecycles to ensure that lifecycle functions are not called concurrently.
 */
export function createSemaphore() {
  let currentDeferredId = 0;

  // the request currently running
  let runningRequest: Promise<any> = Promise.resolve();

  // The currently pending request (only one is allowed)
  let pendingDeferred: { reject: (e: any) => void; id: number } | null = null;

  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        if (pendingDeferred != null) {
          pendingDeferred.reject(new SupersededError('Superseded by newer request'));
        }
        currentDeferredId += 1;
        const myId = currentDeferredId;
        pendingDeferred = { reject, id: myId };

        (async () => {
          try {
            await runningRequest;
          } catch (e) {
            // do nothing
          }
          if (currentDeferredId === myId) {
            pendingDeferred = null;
            runningRequest = fn();
            resolve(runningRequest);
          }
        })();
      });
    },
    clear() {
      if (pendingDeferred != null) {
        pendingDeferred.reject(new SupersededError('Semaphore cleared'));
        currentDeferredId = 0;
        pendingDeferred = null;
        runningRequest = Promise.resolve();
      }
    },
  };
}

/**
 * Error thrown when a new request is made while a previous request is still running.
 * @note Do not need to log this error, it is expected behavior.
 */
export class SupersededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupersededError';
  }
}
