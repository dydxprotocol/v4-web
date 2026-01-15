import type { PositionEntity } from '../PositionsEntity';
import { PositionChange, PositionStatus } from '../PositionsEntity';

export function getPositionStatus(position: PositionEntity): PositionStatus {
  if (position.change === PositionChange.Close || position.change === PositionChange.Liquidate) {
    return PositionStatus.CLOSED;
  }

  if (position.size.value === '0') {
    return PositionStatus.CLOSED;
  }

  if (position.latest && position.size.value !== '0') {
    return PositionStatus.OPEN;
  }

  return PositionStatus.CLOSED;
}
