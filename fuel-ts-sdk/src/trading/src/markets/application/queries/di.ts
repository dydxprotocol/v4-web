import type { StoreService } from '@/shared/lib/store-service';
import { createGetAllAssetsQuery } from './get-all-assets.query';
import { createGetAssetByIdQuery } from './get-asset-by-id.query';
import { createGetCandles } from './get-candles';
import { createGetCandlesStatus } from './get-candles-status';
import { createGetMarketConfigById } from './get-market-config-by-id';
import { createGetWatchedAssetQuery } from './get-watched-asset.query';

export const createMarketQueries = (storeService: StoreService) => ({
  getMarketConfigById: createGetMarketConfigById(storeService),
  getCandles: createGetCandles(storeService),
  getCandlesStatus: createGetCandlesStatus(storeService),
  getAllAssets: createGetAllAssetsQuery(storeService),
  getWatchedAsset: createGetWatchedAssetQuery(storeService),
  getAssetById: createGetAssetByIdQuery(storeService),
});

export type MarketQueries = ReturnType<typeof createMarketQueries>;
