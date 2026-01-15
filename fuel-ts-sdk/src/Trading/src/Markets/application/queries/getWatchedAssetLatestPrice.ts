import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetPriceEntity } from '../../domain';
import { selectAssetPricesByAssetId, selectWatchedAssetId } from '../../infrastructure';

export const createGetWatchedAssetLatestPriceQuery =
  (storeService: StoreService) => (): AssetPriceEntity | undefined => {
    const watchedAssetId = selectWatchedAssetId(storeService.getState());
    if (!watchedAssetId) return undefined;

    return selectAssetPricesByAssetId(storeService.getState(), watchedAssetId).at(0);
  };
