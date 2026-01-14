import type { PositionEntity } from '../PositionsEntity';
import { PositionStatus } from '../PositionsEntity';
import { getPositionStatus } from './getPositionStatus';

export function isPositionOpen(position: PositionEntity): boolean {
  return getPositionStatus(position) === PositionStatus.OPEN;
}
