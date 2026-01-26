import type { StoreService } from '@sdk/shared/lib/StoreService';
import { currentUserActions } from '../../infrastructure';

export interface InvalidateCurrentUserDataCommandDependencies {
  storeService: StoreService;
}

export const createInvalidateCurrentUserDataCommand =
  (deps: InvalidateCurrentUserDataCommandDependencies) => () => {
    deps.storeService.dispatch(currentUserActions.invalidateCurrentUserDataFetch());
  };
