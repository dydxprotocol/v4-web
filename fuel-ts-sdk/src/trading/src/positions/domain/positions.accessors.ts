import { OraclePrice } from '@/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';

import type { Position } from './positions.models';
import { PositionChange, PositionSide, PositionStatus } from './positions.models';

export function getPositionStatus(position: Position): PositionStatus {
  if (position.change === PositionChange.Close || position.change === PositionChange.Liquidate) {
    return PositionStatus.CLOSED;
  }

  if (position.size.value === 0n) {
    return PositionStatus.CLOSED;
  }

  if (position.latest && position.size.value !== 0n) {
    return PositionStatus.OPEN;
  }

  return PositionStatus.CLOSED;
}

export function getPositionSide(position: Position): PositionSide {
  return position.positionKey.isLong ? PositionSide.LONG : PositionSide.SHORT;
}

export function isPositionOpen(position: Position): boolean {
  return getPositionStatus(position) === PositionStatus.OPEN;
}

export function isPositionClosed(position: Position): boolean {
  return getPositionStatus(position) === PositionStatus.CLOSED;
}

export function filterOpenPositions(positions: Position[]): Position[] {
  return positions.filter(isPositionOpen);
}

export function filterClosedPositions(positions: Position[]): Position[] {
  return positions.filter(isPositionClosed);
}

export function calculateEntryPrice(positionHistory: Position[]): OraclePrice {
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
