import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { Address } from '@sdk/shared/types';
import { selectCurrentUserState } from '../../infrastructure';

export interface GetCurrentUserAddressQueryDependencies {
  storeService: StoreService;
}

export const createGetCurrentUserAddressQuery =
  (deps: GetCurrentUserAddressQueryDependencies) => (): Address | undefined => {
    return deps.storeService.select(selectCurrentUserState).data?.address;
  };
