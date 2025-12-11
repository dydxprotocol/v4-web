import type { Position } from './positions.models';
import { PositionChange, PositionSide, PositionStatus } from './positions.models';

export function getPositionStatus(position: Position): PositionStatus {
  if (position.change === PositionChange.Close || position.change === PositionChange.Liquidate) {
    return PositionStatus.CLOSED;
  }

  if (position.size === 0n) {
    return PositionStatus.CLOSED;
  }

  if (position.latest && position.size !== 0n) {
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
