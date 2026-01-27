import type { AssetId } from '@sdk/shared/types';
import type { PositionEntity } from '../PositionsEntity';

export function filterPositionsByAsset(positions: PositionEntity[], assetId: AssetId) {
  return positions.filter((p) => p.assetId === assetId);
}
