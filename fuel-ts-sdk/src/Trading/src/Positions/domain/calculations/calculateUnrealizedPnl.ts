import type { OraclePrice } from '@sdk/shared/models/decimals';
import { UsdValue } from '@sdk/shared/models/decimals';
import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../PositionsEntity';
import { PositionSide } from '../PositionsEntity';

export function calculateUnrealizedPnl(position: PositionEntity, markPrice: OraclePrice): UsdValue {
  if (position.size.value === '0' || position.entryPrice.value === '0') {
    return zero(UsdValue);
  }

  const sizeAtCurrentPrice = DecimalCalculator.value(position.size)
    .multiplyBy(markPrice)
    .divideBy(position.entryPrice)
    .calculate(UsdValue);

  if (position.side === PositionSide.LONG) {
    return DecimalCalculator.first(sizeAtCurrentPrice)
      .subtractBy(position.size)
      .calculate(UsdValue);
  } else {
    return DecimalCalculator.value(position.size)
      .subtractBy(sizeAtCurrentPrice)
      .calculate(UsdValue);
  }
}
