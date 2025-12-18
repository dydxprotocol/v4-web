import { PercentageValue, RatioOutput, UsdValue } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';

import type { MarketConfig } from '../../../shared/types';
import type { RiskMetrics } from '../domain/risk.models';

export function calculateInitialMargin(notional: UsdValue, marketConfig: MarketConfig): UsdValue {
  const imfDecimal = PercentageValue.fromBigInt(marketConfig.initialMarginFraction);
  return DecimalCalculator.value(notional).multiplyBy(imfDecimal).calculate(UsdValue);
}

export function calculateMaintenanceMargin(
  notional: UsdValue,
  marketConfig: MarketConfig
): UsdValue {
  return DecimalCalculator.value(notional)
    .multiplyBy(marketConfig.maintenanceMarginFraction)
    .calculate(UsdValue);
}

export function calculateMaxLeverage(marketConfig: MarketConfig): RatioOutput {
  if (marketConfig.initialMarginFraction === 0n) {
    return zero(RatioOutput);
  }

  const imfDecimal = PercentageValue.fromBigInt(marketConfig.initialMarginFraction);
  return DecimalCalculator.value(RatioOutput.fromFloat(1)).divideBy(imfDecimal).calculate(RatioOutput);
}

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

  const cappedRatio = healthRatio.value > RatioOutput.fromFloat(1).value
    ? RatioOutput.fromFloat(1)
    : healthRatio;

  return DecimalCalculator.value(cappedRatio)
    .multiplyBy(PercentageValue.fromFloat(100))
    .calculate(PercentageValue);
}

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
