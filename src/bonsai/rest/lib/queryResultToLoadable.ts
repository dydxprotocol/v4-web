import { Loadable } from '@/bonsai/lib/loadable';
import { QueryObserverResult } from '@tanstack/react-query';

export function queryResultToLoadable<T>(arg: QueryObserverResult<T>): Loadable<T> {
  return {
    status:
      arg.status === 'pending'
        ? arg.fetchStatus === 'fetching'
          ? ('pending' as const)
          : ('idle' as const)
        : arg.status,
    data: arg.data,
    error: arg.error,
  } as Loadable<T>;
}
