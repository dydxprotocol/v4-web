import { useCallback, useEffect, useState } from 'react';
import type { RequestStatus } from '@sdk/shared/lib/redux';

export type UsePromiseReturn<T> = DefaultState<T> | ErrorState<T> | FulfilledState<T>;

export function usePromise<T>(promised: Promise<T>, autorun = false): UsePromiseReturn<T> {
  const [resolved, setResolved] = useState<T>();
  const [status, setStatus] = useState<RequestStatus | 'unready'>(
    autorun ? 'uninitialized' : 'unready'
  );
  const [error, setError] = useState<Error>();

  useEffect(() => {
    (async () => {
      if (status === 'uninitialized') {
        setStatus('pending');
        setError(undefined);
        try {
          const result = await promised;
          setResolved(result);
          setStatus('fulfilled');
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus('rejected');
        }
      }
    })();
  }, [promised, status]);

  const initialize = useCallback(() => {
    setStatus('uninitialized');
  }, []);

  if (status === 'fulfilled') {
    return {
      data: resolved!,
      error,
      status,
      initialize,
    };
  }

  if (status === 'rejected') {
    if (!error) throw new Error();
    return {
      error,
      status,
      initialize,
    };
  }

  return {
    data: resolved,
    error,
    status,
    initialize,
  };
}

type InitializeFunc = () => void;

type FulfilledState<T> = {
  status: 'fulfilled';
  data: T;
  initialize: InitializeFunc;
  error?: Error;
};

type ErrorState<T> = {
  status: 'rejected';
  data?: T;
  initialize: InitializeFunc;
  error: Error;
};

type DefaultState<T> = {
  status: 'unready' | 'uninitialized' | 'pending';
  data?: T;
  initialize: InitializeFunc;
  error?: Error;
};
