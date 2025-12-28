import type { StoreService } from '@/shared/lib/store-service';
import { createFetchAssetPricesCommand } from './fetch-asset-prices.command';
import { createFetchCandlesCommand } from './fetch-candles.command';
import { createFetchMarketConfigCommand } from './fetch-market-config.command';
import { createSelectAssetCommand } from './select-asset.command';

export const createMarketCommands = (store: StoreService) => ({
  selectAsset: createSelectAssetCommand(store),
  fetchCandles: createFetchCandlesCommand(store),
  fetchMarketConfig: createFetchMarketConfigCommand(store),
  fetchAssetPrices: createFetchAssetPricesCommand(store),
});

export type MarketCommands = ReturnType<typeof createMarketCommands>;
