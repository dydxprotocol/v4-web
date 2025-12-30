import type { OraclePrice } from '@/shared/models/decimals';
import { UsdValue } from '@/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import type { Position } from '../../domain';

export function calculateNotional(positionHistory: Position[], oraclePrice: OraclePrice): UsdValue {
  const currentPosition = getLatestPosition(positionHistory);
  if (!currentPosition) return zero(UsdValue);

  return DecimalCalculator.first(BigIntMath.abs(currentPosition.size))
    .then.multiplyBy(oraclePrice)
    .calculate(UsdValue);
}

function getLatestPosition(positionHistory: Position[]): Position | undefined {
  return positionHistory.find((p) => p.latest);
}
