import type { StoreService } from '@/shared/lib/store-service';
import type { AssetPrice } from '../../domain';
import { selectAssetPricesByAssetId, selectWatchedAssetId } from '../../infrastructure';

export const createGetWatchedAssetLatestPriceQuery =
  (storeService: StoreService) => (): AssetPrice | undefined => {
    const watchedAssetId = selectWatchedAssetId(storeService.getState());
    if (!watchedAssetId) return undefined;

    return selectAssetPricesByAssetId(storeService.getState(), watchedAssetId).at(0);
  };
