import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetEntity } from '../../domain';
import { assetsActions } from '../../infrastructure';

export const createPopulateAssetsCommand =
  (storeService: StoreService) => (asset: AssetEntity[]) => {
    return storeService.dispatch(assetsActions.populateAssets(asset));
  };
