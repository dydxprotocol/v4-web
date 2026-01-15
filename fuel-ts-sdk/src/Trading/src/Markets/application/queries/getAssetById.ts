import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { AssetEntity } from '../../domain';
import { selectAssetById } from '../../infrastructure';

export const createGetAssetByIdQuery =
  (storeService: StoreService) =>
  (assetId: AssetId): AssetEntity | undefined =>
    selectAssetById(storeService.getState(), assetId);
