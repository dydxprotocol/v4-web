import { PercentageValue, UsdValue } from '@/shared/models/decimals';
import { DecimalCalculator } from '@/shared/utils/decimalCalculator';
import type { MarketConfig } from '@/trading/src/markets';

export function calculateInitialMargin(notional: UsdValue, marketConfig: MarketConfig): UsdValue {
  const imfDecimal = PercentageValue.fromBigInt(marketConfig.initialMarginFraction);
  return DecimalCalculator.value(notional).multiplyBy(imfDecimal).calculate(UsdValue);
}
