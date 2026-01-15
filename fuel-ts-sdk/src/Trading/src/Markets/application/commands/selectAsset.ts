import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import { assetPrices, marketConfigs } from '../../infrastructure';

export const createSelectAssetCommand = (store: StoreService) => async (assetId: AssetId) => {
  await Promise.all([
    store.dispatch(marketConfigs.thunks.fetchMarketConfig(assetId)).unwrap(),
    store.dispatch(assetPrices.thunks.fetchAssetPricesByIds([assetId])).unwrap(),
  ]);
};
