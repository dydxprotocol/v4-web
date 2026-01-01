import type { StoreService } from '@/shared/lib/store-service';
import type { Address } from '@/shared/types';
import { positionsApi } from '../../infrastructure';

export const createFetchPositionsByAccount = (store: StoreService) => async (address: Address) => {
  await store.dispatch(positionsApi.endpoints.getPositionsByAddress.initiate({ address })).unwrap();
};
