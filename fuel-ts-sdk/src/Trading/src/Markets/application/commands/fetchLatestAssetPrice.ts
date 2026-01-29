import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import { asyncFetchCurrentAssetPricesThunk } from '../../infrastructure';

export const createFetchLatestAssetPriceCommand =
  (store: StoreService) => async (assetId: AssetId) => {
    await store.dispatch(asyncFetchCurrentAssetPricesThunk(assetId)).unwrap();
  };
