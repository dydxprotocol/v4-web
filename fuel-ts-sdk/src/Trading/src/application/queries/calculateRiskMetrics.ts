import type { UsdValue } from '@/shared/models/decimals';
import type { MarketConfigEntity, MarketQueries } from '../../Markets';
import {
  calculateInitialMargin,
  calculateMaintenanceMargin,
  calculateMaxLeverage,
} from '../../Markets';
import {
  type PositionsQueries,
  type RiskMetricsEntity,
  calculatePositionHealth,
} from '../../Positions';

export interface CalculateRiskMetricsDependencies {
  marketQueries: MarketQueries;
  positionsQueries: PositionsQueries;
}

export const createCalculateRiskMetrics = (
  marketConfig: MarketConfigEntity,
  notional: UsdValue,
  equity: UsdValue
): RiskMetricsEntity => {
  const initialMargin = calculateInitialMargin(marketConfig, notional);
  const maintenanceMargin = calculateMaintenanceMargin(marketConfig, notional);
  const maxLeverage = calculateMaxLeverage(marketConfig);
  const positionHealth = calculatePositionHealth(equity, maintenanceMargin);

  return {
    initialMargin,
    maintenanceMargin,
    maxLeverage,
    positionHealth,
  };
};
