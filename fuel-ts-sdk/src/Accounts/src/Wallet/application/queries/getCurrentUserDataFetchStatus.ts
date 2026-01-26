import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { RequestStatus } from '@sdk/shared/lib/redux';
import { selectCurrentUserState } from '../../infrastructure';

export interface GetCurrentUserDataFetchStatusQueryDependencies {
  storeService: StoreService;
}

export const createGetCurrentUserDataFetchStatusQuery =
  (deps: GetCurrentUserDataFetchStatusQueryDependencies) => (): RequestStatus => {
    return deps.storeService.select(selectCurrentUserState).status;
  };
