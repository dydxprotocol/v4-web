import { CollateralAmount } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../PositionsEntity';

export function calculateTotalCollateral(positions: PositionEntity[]): CollateralAmount {
  if (positions.length === 0) {
    return zero(CollateralAmount);
  }

  let totalFormula = DecimalCalculator.value(positions[0].collateralAmount);

  for (let i = 1; i < positions.length; i++) {
    totalFormula = totalFormula.add(positions[i].collateralAmount);
  }

  return totalFormula.calculate(CollateralAmount);
}
