import { calculateLeverage } from './calculate-leverage';
import { calculateNotional } from './calculate-notional';
import { calculateUnrealizedPnl } from './calculate-unrealized-pnl';
import { calculateUnrealizedPnlPercent } from './calculate-unrealized-pnl-percent';
import { calculateLiquidationPrice } from './calculate-liquidation-price';
import { calculateInitialMargin } from './calculate-initial-margin';
import { calculateMaintenanceMargin } from './calculate-maintenance-margin';
import { calculateMaxLeverage } from './calculate-max-leverage';
import { calculatePositionHealth } from './calculate-position-health';
import { calculateRiskMetrics } from './calculate-risk-metrics';

export const createPositionQueries = () => ({
  calculateNotional,
  calculateUnrealizedPnl,
  calculateUnrealizedPnlPercent,
  calculateLeverage,
  calculateLiquidationPrice,
  calculateInitialMargin,
  calculateMaintenanceMargin,
  calculateMaxLeverage,
  calculatePositionHealth,
  calculateRiskMetrics,
});

export type PositionQueries = ReturnType<typeof createPositionQueries>;
