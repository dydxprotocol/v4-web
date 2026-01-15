import { RatioOutput } from '@sdk/shared/models/decimals';
import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../PositionsEntity';

export function calculatePositionLeverage(position: PositionEntity): RatioOutput {
  if (position.collateralAmount.value <= 0n) {
    return zero(RatioOutput);
  }

  return DecimalCalculator.value(position.size)
    .divideBy(position.collateralAmount)
    .calculate(RatioOutput);
}
