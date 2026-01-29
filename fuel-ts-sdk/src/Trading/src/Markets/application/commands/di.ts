import type { StoreService } from '@sdk/shared/lib/StoreService';
import { createFetchCandlesCommand } from './fetchCandles';
import { createFetchLatestAssetPriceCommand } from './fetchLatestAssetPrice';
import { createFetchMarketStatsCommand } from './fetchMarketStats';
import { createPopulateAssetsCommand } from './populateAssets';
import { createWatchAssetCommand } from './watchAsset';

export const createMarketCommands = (store: StoreService) => ({
  fetchCandles: createFetchCandlesCommand(store),
  fetchLatestAssetPrice: createFetchLatestAssetPriceCommand(store),

  populateAssets: createPopulateAssetsCommand(store),
  watchAsset: createWatchAssetCommand(store),

  fetchMarketStats: createFetchMarketStatsCommand({ storeService: store }),
});

export type MarketCommands = ReturnType<typeof createMarketCommands>;
