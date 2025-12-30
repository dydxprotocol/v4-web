import { UsdValue } from '@/shared/models/decimals';
import { type MarketConfigId } from '@/shared/types';
import { MarketQueries } from '../../markets';
import type { PositionsQueries, RiskMetrics } from '../../positions';
import { createCalculateInitialMargin } from './calculate-initial-margin';
import { createCalculateMaintenanceMargin } from './calculate-maintenance-margin';
import { createCalculateMaxLeverage } from './calculate-max-leverage';

export interface CalculateRiskMetricsDependencies {
  marketQueries: MarketQueries;
  positionsQueries: PositionsQueries;
}

export const createCalculateRiskMetrics =
  (deps: CalculateRiskMetricsDependencies) =>
  (notional: UsdValue, equity: UsdValue, marketConfigId: MarketConfigId): RiskMetrics => {
    const initialMargin = createCalculateInitialMargin(deps)(notional, marketConfigId); // deps.initialMarginGetter(notional, marketConfigId);
    const maintenanceMargin = createCalculateMaintenanceMargin(deps)(notional, marketConfigId);
    const maxLeverage = createCalculateMaxLeverage(deps)(marketConfigId);
    const positionHealth = deps.positionsQueries.calculatePositionHealth(equity, maintenanceMargin);

    return {
      initialMargin,
      maintenanceMargin,
      maxLeverage,
      positionHealth,
    };
  };
