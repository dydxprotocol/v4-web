import type { OraclePrice } from '@/shared/models/decimals';
import { UsdValue } from '@/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../PositionsEntity';
import { PositionSide } from '../PositionsEntity';
import { getPositionSide } from './getPositionSide';

export function calculateUnrealizedPnl(
  positionHistory: PositionEntity[],
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

function getLatestPosition(positionHistory: PositionEntity[]): PositionEntity | undefined {
  return positionHistory.find((p) => p.latest);
}
