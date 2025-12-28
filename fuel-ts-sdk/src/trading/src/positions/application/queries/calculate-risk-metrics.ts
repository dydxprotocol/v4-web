import { UsdValue } from '@/shared/models/decimals';
import type { MarketConfig } from '@/trading/src/markets';
import type { RiskMetrics } from '../../domain';
import { calculateInitialMargin } from './calculate-initial-margin';
import { calculateMaintenanceMargin } from './calculate-maintenance-margin';
import { calculateMaxLeverage } from './calculate-max-leverage';
import { calculatePositionHealth } from './calculate-position-health';

export function calculateRiskMetrics(
  notional: UsdValue,
  equity: UsdValue,
  marketConfig: MarketConfig
): RiskMetrics {
  const initialMargin = calculateInitialMargin(notional, marketConfig);
  const maintenanceMargin = calculateMaintenanceMargin(notional, marketConfig);
  const maxLeverage = calculateMaxLeverage(marketConfig);
  const positionHealth = calculatePositionHealth(equity, maintenanceMargin);

  return {
    initialMargin,
    maintenanceMargin,
    maxLeverage,
    positionHealth,
  };
}
