import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import { PositionSize } from '../positionsDecimals';
import type { PositionEntity } from '../PositionsEntity';

export function calculateTotalSize(positions: PositionEntity[]): PositionSize {
  if (positions.length === 0) {
    return zero(PositionSize);
  }

  let totalFormula = DecimalCalculator.value(positions[0].size);

  for (let i = 1; i < positions.length; i++) {
    totalFormula = totalFormula.add(positions[i].size);
  }

  return totalFormula.calculate(PositionSize);
}