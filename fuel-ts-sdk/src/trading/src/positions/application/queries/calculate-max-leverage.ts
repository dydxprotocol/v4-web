import { PercentageValue, RatioOutput } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import type { MarketConfig } from '@/trading/src/markets';

export function calculateMaxLeverage(marketConfig: MarketConfig): RatioOutput {
  if (marketConfig.initialMarginFraction === 0n) {
    return zero(RatioOutput);
  }

  const imfDecimal = PercentageValue.fromBigInt(marketConfig.initialMarginFraction);
  return DecimalCalculator.value(RatioOutput.fromFloat(1))
    .divideBy(imfDecimal)
    .calculate(RatioOutput);
}
