import type { StoreService } from '@/shared/lib/store-service';
import { createFetchPositionsByAccount } from './fetch-positions-by-account';

export const createPositionCommands = (store: StoreService) => ({
  fetchPositionsByAccount: createFetchPositionsByAccount(store),
});

export type PositionCommands = ReturnType<typeof createPositionCommands>;
