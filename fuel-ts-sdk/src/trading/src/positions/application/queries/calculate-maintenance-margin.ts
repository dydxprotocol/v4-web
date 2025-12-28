import { UsdValue } from '@/shared/models/decimals';
import { DecimalCalculator } from '@/shared/utils/decimalCalculator';
import type { MarketConfig } from '@/trading/src/markets';

export function calculateMaintenanceMargin(
  notional: UsdValue,
  marketConfig: MarketConfig
): UsdValue {
  return DecimalCalculator.value(notional)
    .multiplyBy(marketConfig.maintenanceMarginFraction)
    .calculate(UsdValue);
}
