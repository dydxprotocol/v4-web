import { OraclePrice } from '@/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../PositionsEntity';

export function calculateTotalExposure(positions: PositionEntity[]): OraclePrice {
  if (positions.length === 0) {
    return zero(OraclePrice);
  }

  let totalFormula = DecimalCalculator.value(positions[0].size);

  for (let i = 1; i < positions.length; i++) {
    totalFormula = totalFormula.add(BigIntMath.abs(positions[i].size));
  }

  return totalFormula.calculate(OraclePrice);
}
