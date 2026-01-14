import type { PositionEntity } from '../PositionsEntity';
import { isPositionClosed } from './isPositionClosed';

export function filterClosedPositions(positions: PositionEntity[]): PositionEntity[] {
  return positions.filter(isPositionClosed);
}
