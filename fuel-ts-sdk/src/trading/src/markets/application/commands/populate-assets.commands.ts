import type { StoreService } from '@/shared/lib/store-service';
import type { Asset } from '../../domain';
import { assetsActions } from '../../infrastructure/redux/assets/assets.slice';

export const createPopulateAssetsCommand = (storeService: StoreService) => (asset: Asset[]) => {
  return storeService.dispatch(assetsActions.populateAssets(asset));
};
