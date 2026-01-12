import type { StoreService } from '@/shared/lib/store-service';
import { createGetAllAssetsQuery } from './get-all-assets.query';
import { createGetAssetByIdQuery } from './get-asset-by-id.query';
import { createGetBaseAssetLatestPriceQuery } from './get-base-asset-latest-price.query';
import { createGetBaseAssetQuery } from './get-base-asset.query';
import { createGetCandles } from './get-candles';
import { createGetCandlesStatus } from './get-candles-status';
import { createGetMarketConfigById } from './get-market-config-by-id';
import { createGetWatchedAssetLatestPriceQuery } from './get-watched-asset-latest-price.query';
import { createGetWatchedAssetQuery } from './get-watched-asset.query';

export const createMarketQueries = (storeService: StoreService) => ({
  getMarketConfigById: createGetMarketConfigById(storeService),
  getCandles: createGetCandles(storeService),
  getCandlesStatus: createGetCandlesStatus(storeService),
  getAllAssets: createGetAllAssetsQuery(storeService),
  getWatchedAsset: createGetWatchedAssetQuery(storeService),
  getBaseAsset: createGetBaseAssetQuery(storeService),
  getAssetById: createGetAssetByIdQuery(storeService),
  getWatchedAssetLatestPrice: createGetWatchedAssetLatestPriceQuery(storeService),
  getBaseAssetLatestPrice: createGetBaseAssetLatestPriceQuery(storeService),
});

export type MarketQueries = ReturnType<typeof createMarketQueries>;
