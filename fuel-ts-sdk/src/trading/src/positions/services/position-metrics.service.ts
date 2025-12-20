import {
  OraclePrice,
  PercentageMultiplier,
  PercentageValue,
  RatioOutput,
  UsdValue,
} from '@/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';

import type { MarketConfig } from '@/trading/src/markets';
import { getPositionSide } from '../domain/positions.accessors';
import type { Position } from '../domain/positions.models';
import { PositionSide } from '../domain/positions.models';

export function calculateNotional(positionHistory: Position[], oraclePrice: OraclePrice): UsdValue {
  const currentPosition = getLatestPosition(positionHistory);
  if (!currentPosition) return zero(UsdValue);

  return DecimalCalculator.first(BigIntMath.abs(currentPosition.size))
    .then.multiplyBy(oraclePrice)
    .calculate(UsdValue);
}

export function calculateUnrealizedPnl(
  positionHistory: Position[],
  oraclePrice: OraclePrice
): UsdValue {
  const currentPosition = getLatestPosition(positionHistory);
  if (!currentPosition) return zero(UsdValue);

  const currentValue = DecimalCalculator.value(BigIntMath.abs(currentPosition.size))
    .multiplyBy(oraclePrice)
    .calculate(UsdValue);
  const costBasis = currentPosition.collateralAmount;

  if (getPositionSide(currentPosition) === PositionSide.LONG) {
    return DecimalCalculator.value(currentValue).subtractBy(costBasis).calculate(UsdValue);
  } else {
    return DecimalCalculator.value(costBasis).subtractBy(currentValue).calculate(UsdValue);
  }
}

export function calculateUnrealizedPnlPercent(
  positionHistory: Position[],
  equity: UsdValue,
  oraclePrice: OraclePrice
): PercentageMultiplier {
  if (equity.value <= 0n) return zero(PercentageMultiplier);

  const unrealizedPnl = calculateUnrealizedPnl(positionHistory, oraclePrice);
  return DecimalCalculator.value(unrealizedPnl)
    .multiplyBy(PercentageMultiplier.fromBigInt(100n))
    .then.divideBy(equity)
    .calculate(PercentageMultiplier);
}

export function calculateLeverage(
  positionHistory: Position[],
  equity: UsdValue,
  oraclePrice: OraclePrice
): RatioOutput {
  if (equity.value <= 0n) {
    return zero(RatioOutput);
  }

  const notional = calculateNotional(positionHistory, oraclePrice);
  return DecimalCalculator.value(notional).divideBy(equity).calculate(RatioOutput);
}

export function calculateLiquidationPrice(
  positionHistory: Position[],
  equity: UsdValue,
  marketConfig: MarketConfig,
  otherPositionsRisk: UsdValue
): OraclePrice {
  const currentPosition = getLatestPosition(positionHistory);
  if (!currentPosition) return zero(OraclePrice);

  const side = getPositionSide(currentPosition);
  const size = BigIntMath.abs(currentPosition.size);

  if (size.value === 0n) return zero(OraclePrice);
  const addOrSubtract = side === PositionSide.LONG ? 'add' : 'subtractBy';
  const mmfCoefficient = DecimalCalculator.value(PercentageValue.fromFloat(1))
    [addOrSubtract](marketConfig.maintenanceMarginFraction)
    .calculate(PercentageValue);

  return DecimalCalculator.inNumerator((b) =>
    b.value(equity).subtractBy(otherPositionsRisk).subtractBy(currentPosition.collateralAmount)
  )
    .inDenominator((b) => b.value(size).multiplyBy(mmfCoefficient))
    .calculate(OraclePrice);
}

function getLatestPosition(positionHistory: Position[]): Position | undefined {
  return positionHistory.find((p) => p.latest);
}
