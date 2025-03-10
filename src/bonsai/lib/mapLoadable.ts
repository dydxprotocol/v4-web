import { Loadable } from './loadable';

export function mapLoadableData<T, R>(load: Loadable<T>, map: (obj: T) => R): Loadable<R> {
  return {
    ...load,
    data: load.data != null ? map(load.data) : undefined,
  } as Loadable<R>;
}

export function mergeLoadableData<T, R>(
  one: Loadable<T>,
  two: Loadable<R>
): Loadable<[T | undefined, R | undefined]> {
  const priority = ['pending', 'error', 'success', 'idle'] as const;
  return {
    status: priority[Math.min(priority.indexOf(one.status), priority.indexOf(two.status))]!,
    error: (one as any).error ?? (two as any).error ?? undefined,
    data: [one.data, two.data],
  } as any;
}

export function mergeLoadableStatus(...status: Array<Loadable<any>>): Loadable<any>['status'] {
  if (status.some((s) => s.status === 'error' && s.data == null)) {
    return 'error';
  }
  if (status.some((s) => s.status === 'pending' && s.data == null)) {
    return 'pending';
  }
  if (status.some((s) => s.status === 'idle')) {
    return 'idle';
  }
  return 'success';
}

// CAUTION: doesn't take into account the actual data state so shouldn't be trusted alone, also check for data presence
export function mergeLoadableStatusState(
  ...status: Array<Loadable<any>['status']>
): Loadable<any>['status'] {
  if (status.some((s) => s === 'error')) {
    return 'error';
  }
  if (status.some((s) => s === 'pending')) {
    return 'pending';
  }
  if (status.some((s) => s === 'idle')) {
    return 'idle';
  }
  return 'success';
}
