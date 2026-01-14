import type { StoreService } from '@/shared/lib/StoreService';
import type { AssetEntity } from '../../domain';
import { selectBaseAsset } from '../../infrastructure';

export const createGetBaseAssetQuery =
  (storeService: StoreService) => (): AssetEntity | undefined =>
    selectBaseAsset(storeService.getState());
