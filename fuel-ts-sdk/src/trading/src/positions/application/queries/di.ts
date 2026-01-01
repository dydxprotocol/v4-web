import type { StoreService } from '@/shared/lib/store-service';
import { calculateLeverage } from './calculate-leverage';
import { calculateNotional } from './calculate-notional';
import { calculatePositionHealth } from './calculate-position-health';
import { calculateUnrealizedPnl } from './calculate-unrealized-pnl';
import { calculateUnrealizedPnlPercent } from './calculate-unrealized-pnl-percent';
import { createGetAccountPositions } from './get-positions-by-address';
import { createGetPositionById } from './get-positions-by-id';

export const createPositionQueries = (storeService: StoreService) => ({
  calculateNotional,
  calculateUnrealizedPnl,
  calculateUnrealizedPnlPercent,
  calculateLeverage,
  calculatePositionHealth,
  getAccountPositions: createGetAccountPositions(storeService),
  getPositionById: createGetPositionById(storeService),
});

export type PositionsQueries = ReturnType<typeof createPositionQueries>;
