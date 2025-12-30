import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import { assetPrices } from '../../infrastructure';

export const createFetchAssetPricesCommand =
  (store: StoreService) => async (assetIds: AssetId[]) => {
    await store.dispatch(assetPrices.thunks.fetchAssetPricesByIds(assetIds)).unwrap();
  };
