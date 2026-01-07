import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import { assetsActions } from '../../infrastructure/redux/assets/assets.slice';

export const createWatchAssetCommand = (storeService: StoreService) => (assetId: AssetId) => {
  return storeService.dispatch(assetsActions.watchAsset(assetId));
};
