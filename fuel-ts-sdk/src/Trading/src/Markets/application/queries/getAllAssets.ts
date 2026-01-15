import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetEntity } from '../../domain';
import { selectAllAssets } from '../../infrastructure';

export const createGetAllAssetsQuery = (storeService: StoreService) => (): AssetEntity[] =>
  selectAllAssets(storeService.getState());
