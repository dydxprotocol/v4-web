import type { StoreService } from '@/shared/lib/store-service';
import { calculateLeverage } from './calculate-leverage';
import { calculateNotional } from './calculate-notional';
import { calculatePositionHealth } from './calculate-position-health';
import { calculateUnrealizedPnl } from './calculate-unrealized-pnl';
import { calculateUnrealizedPnlPercent } from './calculate-unrealized-pnl-percent';
import { createGetPositionById } from './get-position-by-id';
import { createGetAccountPositions } from './get-positions-by-address';

export const createPositionQueries = (storeService: StoreService) => ({
  calculateNotional,
  calculateUnrealizedPnl,
  calculateUnrealizedPnlPercent,
  calculateLeverage,
  calculatePositionHealth,
  getPositionById: createGetPositionById(storeService),
  getAccountPositions: createGetAccountPositions(storeService),
});

export type PositionsQueries = ReturnType<typeof createPositionQueries>;
