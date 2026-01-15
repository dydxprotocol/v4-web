import type { OraclePrice, UsdValue } from '@sdk/shared/models/decimals';
import { PercentageMultiplier } from '@sdk/shared/models/decimals';
import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import { type PositionEntity, calculateUnrealizedPnl } from '../../domain';

export function calculateUnrealizedPnlPercent(
  positionHistory: PositionEntity[],
  equity: UsdValue,
  oraclePrice: OraclePrice
): PercentageMultiplier {
  if (BigInt(equity.value) <= 0n) return zero(PercentageMultiplier);

  const unrealizedPnl = calculateUnrealizedPnl(positionHistory, oraclePrice);
  return DecimalCalculator.value(unrealizedPnl)
    .multiplyBy(PercentageMultiplier.fromBigInt(100n))
    .then.divideBy(equity)
    .calculate(PercentageMultiplier);
}
