import type { StoreService } from '@/shared/lib/store-service';
import { createFetchCurrentPositionsCommand } from './fetch-current-positions';
import { createFetchPositionsByAccountCommand } from './fetch-positions-by-account';

export const createPositionCommands = (store: StoreService) => ({
  fetchPositionsByAccount: createFetchPositionsByAccountCommand(store),
  fetchCurrentPositions: createFetchCurrentPositionsCommand(store),
});

export type PositionCommands = ReturnType<typeof createPositionCommands>;
