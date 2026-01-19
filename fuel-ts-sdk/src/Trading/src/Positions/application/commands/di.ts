import type { SdkConfig } from '@sdk/shared/lib/SdkConfig';
import type { StoreService } from '@sdk/shared/lib/StoreService';
import { createDecreasePositionCommand } from './decreasePosition';
import { createFetchPositionsByAccount } from './fetchPositionsByAccount';
import { createSubmitOrder } from './submitOrder';

export const createPositionCommands = (store: StoreService, sdkConfig: SdkConfig) => ({
  fetchPositionsByAccount: createFetchPositionsByAccount(store),
  submitOrder: createSubmitOrder(sdkConfig),
  decreasePosition: createDecreasePositionCommand(store, sdkConfig),
});

export type PositionCommands = ReturnType<typeof createPositionCommands>;
