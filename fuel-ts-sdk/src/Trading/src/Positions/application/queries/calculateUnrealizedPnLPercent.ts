import type { OraclePrice, UsdValue } from '@/shared/models/decimals';
import { PercentageMultiplier } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/DecimalCalculator';
import { type PositionEntity, calculateUnrealizedPnl } from '../../domain';

export function calculateUnrealizedPnlPercent(
  positionHistory: PositionEntity[],
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
