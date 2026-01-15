import type { StoreService } from '@sdk/shared/lib/StoreService';
import { createFetchPositionsByAccount } from './fetchPositionsByAccount';
import { createSubmitOrder } from './submitOrder';

export const createPositionCommands = (store: StoreService) => ({
  fetchPositionsByAccount: createFetchPositionsByAccount(store),
  submitOrder: createSubmitOrder(),
});

export type PositionCommands = ReturnType<typeof createPositionCommands>;
