import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { Address } from '@sdk/shared/types';
import { positionsApi } from '../../infrastructure';

export interface FetchPositionsByAccountDependencies {
  storeService: StoreService;
}

export const createFetchPositionsByAccountCommand =
  (deps: FetchPositionsByAccountDependencies) =>
  async (address: Address, forceRefetch?: boolean) => {
    await deps.storeService
      .dispatch(positionsApi.endpoints.getPositionsByAddress.initiate(address, { forceRefetch }))
      .unwrap();
  };
