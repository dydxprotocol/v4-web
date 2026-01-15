import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import { assetsActions } from '../../infrastructure/redux/Assets/slice';

export const createWatchAssetCommand = (storeService: StoreService) => (assetId: AssetId) => {
  return storeService.dispatch(assetsActions.watchAsset(assetId));
};
