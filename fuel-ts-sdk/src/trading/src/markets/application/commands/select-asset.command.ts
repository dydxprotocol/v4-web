import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import * as marketConfigs from '../../state/market-configs';
import * as assetPrices from '../../state/asset-prices';
import * as candles from '../../state/candles';

export const createSelectAssetCommand = (store: StoreService) => async (assetId: AssetId) => {
  await Promise.all([
    store.dispatch(marketConfigs.thunks.fetchMarketConfig(assetId)).unwrap(),
    store.dispatch(assetPrices.thunks.fetchAssetPricesByIds([assetId])).unwrap(),
    store.dispatch(candles.thunks.fetchCandles({ asset: assetId, interval: 'H1', limit: 100 })).unwrap(),
  ]);
};
