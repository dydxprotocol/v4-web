import type { PositionEntity } from '../PositionsEntity';
import { isPositionOpen } from './isPositionOpen';

export function filterOpenPositions(positions: PositionEntity[]): PositionEntity[] {
  return positions.filter(isPositionOpen);
}
