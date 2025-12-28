import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import * as assetPrices from '../../state/asset-prices';

export const createFetchAssetPricesCommand = (store: StoreService) => async (assetIds: AssetId[]) => {
  await store.dispatch(assetPrices.thunks.fetchAssetPricesByIds(assetIds)).unwrap();
};
