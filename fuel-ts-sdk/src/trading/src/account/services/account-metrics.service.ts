import { OraclePrice, PercentageValue, RatioOutput, UsdValue } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';

import { type Position, calculateNotional, calculateUnrealizedPnl } from '../../positions';
import type { AccountMetrics } from '../domain/account.models';

export function calculateAccountEquity(
  positions: Position[],
  collateralBalance: UsdValue,
  oraclePrices: Map<string, OraclePrice>
): UsdValue {
  const positionKeys = new Set(positions.map((p) => JSON.stringify(p.positionKey)));

  const totalUnrealizedPnl = Array.from(positionKeys).reduce((sum, positionKeyStr) => {
    const positionKey = JSON.parse(positionKeyStr);
    const positionHistory = positions.filter(
      (p) => JSON.stringify(p.positionKey) === positionKeyStr
    );

    const price = oraclePrices.get(positionKey.indexAssetId);
    if (!price) return sum;

    const unrealizedPnl = calculateUnrealizedPnl(positionHistory, price);
    return DecimalCalculator.value(sum).add(unrealizedPnl).calculate(UsdValue);
  }, zero(UsdValue));

  return DecimalCalculator.value(collateralBalance).add(totalUnrealizedPnl).calculate(UsdValue);
}

export function calculateTotalNotional(
  positions: Position[],
  oraclePrices: Map<string, OraclePrice>
): UsdValue {
  const positionKeys = new Set(positions.map((p) => JSON.stringify(p.positionKey)));

  return Array.from(positionKeys).reduce((sum, positionKeyStr) => {
    const positionKey = JSON.parse(positionKeyStr);
    const positionHistory = positions.filter(
      (p) => JSON.stringify(p.positionKey) === positionKeyStr
    );

    const price = oraclePrices.get(positionKey.indexAssetId);
    if (!price) return sum;

    const notional = calculateNotional(positionHistory, price);
    return DecimalCalculator.value(sum).add(notional).calculate(UsdValue);
  }, zero(UsdValue));
}

export function calculateAccountLeverage(totalNotional: UsdValue, equity: UsdValue): RatioOutput {
  if (equity.value <= 0n) {
    return zero(RatioOutput);
  }

  return DecimalCalculator.value(totalNotional).divideBy(equity).calculate(RatioOutput);
}

export function calculateMarginUsage(usedMargin: UsdValue, totalMargin: UsdValue): PercentageValue {
  if (totalMargin.value <= 0n) {
    return zero(PercentageValue);
  }

  return DecimalCalculator.value(usedMargin)
    .multiplyBy(PercentageValue.fromFloat(100))
    .then.divideBy(totalMargin)
    .calculate(PercentageValue);
}

export function calculateAccountMetrics(
  positions: Position[],
  collateralBalance: UsdValue,
  oraclePrices: Map<string, OraclePrice>,
  usedMargin: UsdValue
): AccountMetrics {
  const equity = calculateAccountEquity(positions, collateralBalance, oraclePrices);
  const totalNotional = calculateTotalNotional(positions, oraclePrices);
  const accountLeverage = calculateAccountLeverage(totalNotional, equity);
  const marginUsage = calculateMarginUsage(usedMargin, equity);

  return {
    equity,
    totalNotional,
    accountLeverage,
    marginUsage,
  };
}
