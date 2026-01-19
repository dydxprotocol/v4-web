import type { StoreService } from '@sdk/shared/lib/StoreService';
import { createGetAllAssetsQuery } from './getAllAssets';
import { createGetAssetByIdQuery } from './getAssetById';
import { createGetAssetLatestPriceQuery } from './getAssetLatestPrice';
import { createGetBaseAssetQuery } from './getBaseAsset';
import { createGetBaseAssetLatestPriceQuery } from './getBaseAssetLatestPrice';
import { createGetCandles } from './getCandles';
import { createGetCandlesStatus } from './getCandlesStatus';
import { createGetMarketConfigById } from './getMarketConfigById';
import { createGetWatchedAssetQuery } from './getWatchedAsset';
import { createGetWatchedAssetLatestPriceQuery } from './getWatchedAssetLatestPrice';

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
  getAssetLatestPrice: createGetAssetLatestPriceQuery(storeService),
});

export type MarketQueries = ReturnType<typeof createMarketQueries>;
