import type { AppDispatch, LoadableState, RootState, RootStore } from './redux';

/**
 * Result type for operations that depend on async data
 */
export type DataResult<T> =
  | { status: 'idle'; data: never }
  | { status: 'pending'; data: never }
  | { status: 'rejected'; data: never; error: string | null }
  | { status: 'fulfilled'; data: T };

/**
 * Service wrapper around Redux store providing a cleaner API
 */
export interface StoreService {
  dispatch: AppDispatch;
  select<T>(selector: (state: RootState) => T): T;
  getState(): RootState;
  withRequiredData<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => TResult,
    dependencies: Array<(state: RootState) => LoadableState<any>>
  ): (...args: TArgs) => DataResult<TResult>;
}

export const createStoreService = (store: RootStore): StoreService => {
  const select = <T>(selector: (state: RootState) => T): T => {
    return selector(store.getState());
  };

  const withRequiredData = <TArgs extends any[], TResult>(
    fn: (...args: TArgs) => TResult,
    dependencies: Array<(state: RootState) => LoadableState<any>>
  ) => {
    return (...args: TArgs): DataResult<TResult> => {
      // Check all dependencies
      for (const depSelector of dependencies) {
        const depState = select(depSelector);

        if (depState.fetchStatus === 'idle') {
          return { status: 'idle', data: undefined as never };
        }

        if (depState.fetchStatus === 'pending') {
          return { status: 'pending', data: undefined as never };
        }

        if (depState.fetchStatus === 'rejected') {
          return { status: 'rejected', data: undefined as never, error: depState.error };
        }
      }

      // All dependencies fulfilled, execute function
      const result = fn(...args);
      return { status: 'fulfilled', data: result };
    };
  };

  return {
    dispatch: store.dispatch,
    select,
    getState: () => store.getState(),
    withRequiredData,
  };
};
