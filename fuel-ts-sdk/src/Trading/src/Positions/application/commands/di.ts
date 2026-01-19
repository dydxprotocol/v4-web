import type { StoreService } from '@sdk/shared/lib/StoreService';
import { createDecreasePositionCommand } from './decreasePosition';
import { createFetchPositionsByAccount } from './fetchPositionsByAccount';
import { createSubmitOrder } from './submitOrder';

export const createPositionCommands = (store: StoreService) => ({
  fetchPositionsByAccount: createFetchPositionsByAccount(store),
  submitOrder: createSubmitOrder(),
  decreasePosition: createDecreasePositionCommand(store),
});

export type PositionCommands = ReturnType<typeof createPositionCommands>;
