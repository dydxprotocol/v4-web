import type { OraclePrice } from '@sdk/shared/models/decimals';
import { UsdValue } from '@sdk/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../../domain';

export function calculateNotional(
  positionHistory: PositionEntity[],
  oraclePrice: OraclePrice
): UsdValue {
  const currentPosition = getLatestPosition(positionHistory);
  if (!currentPosition) return zero(UsdValue);

  return DecimalCalculator.first(BigIntMath.abs(currentPosition.size))
    .then.multiplyBy(oraclePrice)
    .calculate(UsdValue);
}

function getLatestPosition(positionHistory: PositionEntity[]): PositionEntity | undefined {
  return positionHistory.find((p) => p.latest);
}
