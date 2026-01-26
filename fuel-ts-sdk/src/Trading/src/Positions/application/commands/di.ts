import type { DecreasePositionDependencies } from './decreasePosition';
import { createDecreasePositionCommand } from './decreasePosition';
import type { FetchPositionsByAccountDependencies } from './fetchPositionsByAccount';
import { createFetchPositionsByAccountCommand } from './fetchPositionsByAccount';
import type { SubmitOrderDependencies } from './submitOrder';
import { createSubmitOrder } from './submitOrder';

export type PositionCommandsDependencies = SubmitOrderDependencies &
  FetchPositionsByAccountDependencies &
  DecreasePositionDependencies;

export const createPositionCommands = (deps: PositionCommandsDependencies) => ({
  fetchPositionsByAccount: createFetchPositionsByAccountCommand(deps),
  submitOrder: createSubmitOrder(deps),
  decreasePosition: createDecreasePositionCommand(deps),
});

export type PositionCommands = ReturnType<typeof createPositionCommands>;
