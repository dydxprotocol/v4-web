import { OraclePrice } from '@sdk/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../PositionsEntity';
import { PositionChange } from '../PositionsEntity';

export function calculateEntryPrice(positionHistory: PositionEntity[]): OraclePrice {
  const increaseEvents = positionHistory.filter((p) => p.change === PositionChange.Increase);

  if (increaseEvents.length === 0) {
    return zero(OraclePrice);
  }

  const [firstEvent, ...nextEvents] = increaseEvents;

  let totalCollateralFormula = DecimalCalculator.value(firstEvent.collateralTransferred);
  let totalSizeAddedFormula = DecimalCalculator.value(firstEvent.size);

  for (const event of nextEvents) {
    totalCollateralFormula = totalCollateralFormula.add(event.collateralTransferred);
    totalSizeAddedFormula = totalSizeAddedFormula.add(BigIntMath.abs(event.size));
  }

  if (totalSizeAddedFormula.calculate(OraclePrice).value === 0n) {
    return zero(OraclePrice);
  }

  return DecimalCalculator.inNumerator(totalCollateralFormula)
    .inDenominator(totalSizeAddedFormula)
    .calculate(OraclePrice);
}
