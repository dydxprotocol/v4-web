import type { StoreService } from '@/shared/lib/store-service';
import { createFetchPositionsByAccount } from './fetch-positions-by-account';
import { createSubmitOrder } from './submit-order';

export const createPositionCommands = (store: StoreService) => ({
  fetchPositionsByAccount: createFetchPositionsByAccount(store),
  submitOrder: createSubmitOrder(),
});

export type PositionCommands = ReturnType<typeof createPositionCommands>;
