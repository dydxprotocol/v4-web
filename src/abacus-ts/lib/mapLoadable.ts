import { Loadable } from './loadable';

export function mapLoadableData<T, R>(load: Loadable<T>, map: (obj: T) => R): Loadable<R> {
  return {
    ...load,
    data: load.data != null ? map(load.data) : undefined,
  } as Loadable<R>;
}
