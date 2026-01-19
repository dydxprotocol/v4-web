import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { AssetPriceEntity } from '../../domain';
import { selectAssetPricesByAssetId } from '../../infrastructure';

export const createGetAssetLatestPriceQuery =
  (storeService: StoreService) =>
  (assetId: AssetId): AssetPriceEntity | undefined => {
    return selectAssetPricesByAssetId(storeService.getState(), assetId).at(0);
  };
