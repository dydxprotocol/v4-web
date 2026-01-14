import type { PositionEntity } from '../PositionsEntity';
import { PositionSide } from '../PositionsEntity';

export function getPositionSide(position: PositionEntity): PositionSide {
  return position.positionKey.isLong ? PositionSide.LONG : PositionSide.SHORT;
}
