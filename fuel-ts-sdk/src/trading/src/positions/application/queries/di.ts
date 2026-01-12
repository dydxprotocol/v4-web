import type { StoreService } from '@/shared/lib/store-service';
import { calculateLeverage } from './calculate-leverage';
import { calculateNotional } from './calculate-notional';
import { calculatePositionHealth } from './calculate-position-health';
import { calculateUnrealizedPnl } from './calculate-unrealized-pnl';
import { calculateUnrealizedPnlPercent } from './calculate-unrealized-pnl-percent';
import { createGetAccountWatchedAssetPositions } from './get-account-positions';
import { createGetPositionById } from './get-positions-by-id';

export const createPositionQueries = (storeService: StoreService) => ({
  calculateNotional,
  calculateUnrealizedPnl,
  calculateUnrealizedPnlPercent,
  calculateLeverage,
  calculatePositionHealth,
  getAccountPositions: createGetAccountWatchedAssetPositions(storeService),
  getPositionById: createGetPositionById(storeService),
});

export type PositionsQueries = ReturnType<typeof createPositionQueries>;
