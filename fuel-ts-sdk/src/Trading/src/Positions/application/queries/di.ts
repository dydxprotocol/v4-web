import type { StoreService } from '@sdk/shared/lib/StoreService';
import { calculateUnrealizedPnlPercent } from './calculateUnrealizedPnLPercent';
import { createGetAccountWatchedAssetPositions } from './getAccountPositions';
import { createGetPositionById } from './getPositionsById';

export const createPositionQueries = (storeService: StoreService) => ({
  calculateUnrealizedPnlPercent,
  getAccountPositions: createGetAccountWatchedAssetPositions(storeService),
  getPositionById: createGetPositionById(storeService),
});

export type PositionsQueries = ReturnType<typeof createPositionQueries>;
