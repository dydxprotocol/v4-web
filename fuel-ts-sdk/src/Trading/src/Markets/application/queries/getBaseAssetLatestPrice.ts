import type { StoreService } from '@/shared/lib/StoreService';
import type { AssetPriceEntity } from '../../domain';
import { selectAssetPricesByAssetId, selectBaseAssetId } from '../../infrastructure';

export const createGetBaseAssetLatestPriceQuery =
  (storeService: StoreService) => (): AssetPriceEntity | undefined => {
    const baseAssetId = selectBaseAssetId(storeService.getState());
    if (!baseAssetId) return undefined;

    return selectAssetPricesByAssetId(storeService.getState(), baseAssetId).at(0);
  };
