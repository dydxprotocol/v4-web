import type { StoreService } from '@/shared/lib/store-service';
import type { Address } from '@/shared/types';
import { positions } from '../../infrastructure';

export const createFetchCurrentPositionsCommand =
  (store: StoreService) => async (account: Address) => {
    await store.dispatch(positions.thunks.fetchCurrentPositions(account)).unwrap();
  };
