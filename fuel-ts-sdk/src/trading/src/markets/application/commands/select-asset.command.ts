import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import { assetPrices, marketConfigs } from '../../infrastructure';

export const createSelectAssetCommand = (store: StoreService) => async (assetId: AssetId) => {
  await Promise.all([
    store.dispatch(marketConfigs.thunks.fetchMarketConfig(assetId)).unwrap(),
    store.dispatch(assetPrices.thunks.fetchAssetPricesByIds([assetId])).unwrap(),
  ]);
};
