import { OraclePrice, UsdValue } from '@/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import { getPositionSide, type Position, PositionSide } from '../../domain';

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

function getLatestPosition(positionHistory: Position[]): Position | undefined {
  return positionHistory.find((p) => p.latest);
}
