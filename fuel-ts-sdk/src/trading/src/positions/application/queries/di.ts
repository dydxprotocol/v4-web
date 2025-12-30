import { StoreService } from '@/shared/lib/store-service';
import { createCalculateLiquidationPrice } from '../../../domain-services/queries/calculate-liquidation-price';
import { calculateLeverage } from './calculate-leverage';
import { calculateNotional } from './calculate-notional';
import { calculatePositionHealth } from './calculate-position-health';
import { calculateUnrealizedPnl } from './calculate-unrealized-pnl';
import { calculateUnrealizedPnlPercent } from './calculate-unrealized-pnl-percent';
import { createGetPositionById } from './get-position-by-id';

export const createPositionQueries = (storeService: StoreService) => ({
  calculateNotional,
  calculateUnrealizedPnl,
  calculateUnrealizedPnlPercent,
  calculateLeverage,
  createCalculateLiquidationPrice,
  calculatePositionHealth,
  getPositionById: createGetPositionById(storeService),
});

export type PositionsQueries = ReturnType<typeof createPositionQueries>;
