import type { StoreService } from '@/shared/lib/store-service';
import type { AssetPrice } from '../../domain';
import { selectAssetPricesByAssetId, selectBaseAssetId } from '../../infrastructure';

export const createGetBaseAssetLatestPriceQuery =
  (storeService: StoreService) => (): AssetPrice | undefined => {
    const baseAssetId = selectBaseAssetId(storeService.getState());
    if (!baseAssetId) return undefined;

    return selectAssetPricesByAssetId(storeService.getState(), baseAssetId).at(0);
  };
