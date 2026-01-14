import type { UsdValue } from '@/shared/models/decimals';
import { PercentageValue, RatioOutput } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/DecimalCalculator';

export function calculatePositionHealth(
  equity: UsdValue,
  maintenanceMargin: UsdValue
): PercentageValue {
  if (equity.value <= 0n || maintenanceMargin.value <= 0n) {
    return zero(PercentageValue);
  }

  const healthRatio = DecimalCalculator.value(equity)
    .divideBy(maintenanceMargin)
    .calculate(RatioOutput);

  const cappedRatio =
    healthRatio.value > RatioOutput.fromFloat(1).value ? RatioOutput.fromFloat(1) : healthRatio;

  return DecimalCalculator.value(cappedRatio)
    .multiplyBy(PercentageValue.fromFloat(100))
    .calculate(PercentageValue);
}
