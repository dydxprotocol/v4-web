import type { StoreService } from '@/shared/lib/StoreService';
import { createFetchCandlesCommand } from './fetchCandles';
import { createFetchLatestAssetPriceCommand } from './fetchLatestAssetPrice';
import { createFetchMarketConfigCommand } from './fetchMarketConfig';
import { createPopulateAssetsCommand } from './populateAssets';
import { createSelectAssetCommand } from './selectAsset';
import { createWatchAssetCommand } from './watchAsset';

export const createMarketCommands = (store: StoreService) => ({
  selectAsset: createSelectAssetCommand(store),
  fetchCandles: createFetchCandlesCommand(store),
  fetchMarketConfig: createFetchMarketConfigCommand(store),
  fetchLatestAssetPrice: createFetchLatestAssetPriceCommand(store),

  populateAssets: createPopulateAssetsCommand(store),
  watchAsset: createWatchAssetCommand(store),
});

export type MarketCommands = ReturnType<typeof createMarketCommands>;
