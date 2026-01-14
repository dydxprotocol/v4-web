import type { PositionEntity } from '../PositionsEntity';
import { PositionStatus } from '../PositionsEntity';
import { getPositionStatus } from './getPositionStatus';

export function isPositionClosed(position: PositionEntity): boolean {
  return getPositionStatus(position) === PositionStatus.CLOSED;
}
