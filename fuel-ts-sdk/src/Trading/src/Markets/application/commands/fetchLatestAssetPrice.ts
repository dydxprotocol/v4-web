import type { StoreService } from '@/shared/lib/StoreService';
import type { AssetId } from '@/shared/types';
import { assetPrices } from '../../infrastructure';

export const createFetchLatestAssetPriceCommand =
  (store: StoreService) => async (assetId: AssetId) => {
    await store.dispatch(assetPrices.thunks.fetchCurrentAssetPrices(assetId)).unwrap();
  };
