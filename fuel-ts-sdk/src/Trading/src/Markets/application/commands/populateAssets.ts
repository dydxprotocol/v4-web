import type { StoreService } from '@/shared/lib/StoreService';
import type { AssetEntity } from '../../domain';
import { assetsActions } from '../../infrastructure/redux/Assets/slice';

export const createPopulateAssetsCommand =
  (storeService: StoreService) => (asset: AssetEntity[]) => {
    return storeService.dispatch(assetsActions.populateAssets(asset));
  };
