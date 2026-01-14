import type { StoreService } from '@/shared/lib/StoreService';
import type { AssetId } from '@/shared/types';
import { assetsActions } from '../../infrastructure/redux/Assets/slice';

export const createWatchAssetCommand = (storeService: StoreService) => (assetId: AssetId) => {
  return storeService.dispatch(assetsActions.watchAsset(assetId));
};
