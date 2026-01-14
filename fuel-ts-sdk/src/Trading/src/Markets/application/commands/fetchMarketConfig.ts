import type { StoreService } from '@/shared/lib/StoreService';
import type { AssetId } from '@/shared/types';
import { marketConfigs } from '../../infrastructure';

export const createFetchMarketConfigCommand = (store: StoreService) => async (assetId: AssetId) => {
  await store.dispatch(marketConfigs.thunks.fetchMarketConfig(assetId)).unwrap();
};
