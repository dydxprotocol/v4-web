import type { AppDispatch, RootState, RootStore } from './redux';

/**
 * Service wrapper providing store access for business logic layer
 */
export interface StoreService {
  dispatch: AppDispatch;
  select<T>(selector: (state: RootState) => T): T;
  getState(): RootState;
}

export const createStoreService = (store: RootStore): StoreService => {
  const select = <T>(selector: (state: RootState) => T): T => {
    return selector(store.getState());
  };

  return {
    dispatch: store.dispatch,
    select,
    getState: () => store.getState(),
  };
};
