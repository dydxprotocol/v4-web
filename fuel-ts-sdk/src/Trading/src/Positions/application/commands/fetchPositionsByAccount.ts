import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { Address } from '@sdk/shared/types';
import { positionsApi } from '../../infrastructure';

export const createFetchPositionsByAccount =
  (store: StoreService) => async (address: Address, forceRefetch?: boolean) => {
    await store
      .dispatch(positionsApi.endpoints.getPositionsByAddress.initiate(address, { forceRefetch }))
      .unwrap();
  };
