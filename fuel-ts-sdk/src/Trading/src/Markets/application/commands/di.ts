import type { StoreService } from '@sdk/shared/lib/StoreService';
import { createFetchCandlesCommand } from './fetchCandles';
import { createFetchLatestAssetPriceCommand } from './fetchLatestAssetPrice';
import { createPopulateAssetsCommand } from './populateAssets';
import { createSelectAssetCommand } from './selectAsset';
import { createWatchAssetCommand } from './watchAsset';

export const createMarketCommands = (store: StoreService) => ({
  selectAsset: createSelectAssetCommand(store),
  fetchCandles: createFetchCandlesCommand(store),
  fetchLatestAssetPrice: createFetchLatestAssetPriceCommand(store),

  populateAssets: createPopulateAssetsCommand(store),
  watchAsset: createWatchAssetCommand(store),
});

export type MarketCommands = ReturnType<typeof createMarketCommands>;
