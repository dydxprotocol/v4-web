import type { StoreService } from '@/shared/lib/store-service';
import type { Address } from '@/shared/types';
import * as positions from '../../state/positions';

export const createFetchPositionsByAccountCommand =
  (store: StoreService) => async (account: Address) => {
    await store.dispatch(positions.thunks.fetchPositionsByAccount(account)).unwrap();
  };
