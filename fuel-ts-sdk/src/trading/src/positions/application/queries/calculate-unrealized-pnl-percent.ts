import type { OraclePrice, UsdValue } from '@/shared/models/decimals';
import { PercentageMultiplier } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import type { Position } from '../../domain';
import { calculateUnrealizedPnl } from './calculate-unrealized-pnl';

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
