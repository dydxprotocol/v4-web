import { UsdValue } from '@/shared/models/decimals';
import { MarketConfigId } from '@/shared/types';
import { DecimalCalculator } from '@/shared/utils/decimalCalculator';
import { MarketQueries } from '../../markets';

export interface CalculateMaintenanceMarginDependencies {
  marketQueries: MarketQueries;
}

export const createCalculateMaintenanceMargin =
  (deps: CalculateMaintenanceMarginDependencies) =>
  (notional: UsdValue, marketConfigId: MarketConfigId): UsdValue => {
    const marketConfig = deps.marketQueries.getMarketConfigById(marketConfigId);
    return DecimalCalculator.value(notional)
      .multiplyBy(marketConfig.maintenanceMarginFraction)
      .calculate(UsdValue);
  };
