import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import * as marketConfigs from '../../state/market-configs';

export const createFetchMarketConfigCommand = (store: StoreService) => async (assetId: AssetId) => {
  await store.dispatch(marketConfigs.thunks.fetchMarketConfig(assetId)).unwrap();
};
