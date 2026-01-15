import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetEntity } from '../../domain';
import { selectWatchedAsset } from '../../infrastructure';

export const createGetWatchedAssetQuery =
  (storeService: StoreService) => (): AssetEntity | undefined =>
    selectWatchedAsset(storeService.getState());
