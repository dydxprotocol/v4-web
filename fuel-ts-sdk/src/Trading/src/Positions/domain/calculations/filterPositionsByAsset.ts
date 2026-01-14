import type { AssetId } from '@/shared/types';
import type { PositionEntity } from '../PositionsEntity';

export function filterPositionsByAsset(
  positions: PositionEntity[],
  assetId: AssetId
): PositionEntity[] {
  return positions.filter((p) => p.positionKey.indexAssetId === assetId);
}
