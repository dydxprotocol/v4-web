import type { StoreService } from '@sdk/shared/lib/StoreService';
import { asyncFetchCurrentUserBalancesThunk } from '../../infrastructure';

export interface FetchCurrentUserDataCommandDependencies {
  storeService: StoreService;
}

export const createFetchCurrentUserDataCommand =
  (deps: FetchCurrentUserDataCommandDependencies) => async () => {
    await deps.storeService.dispatch(asyncFetchCurrentUserBalancesThunk());
  };
