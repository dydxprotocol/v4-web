import type { StoreService } from '@/shared/lib/store-service';
import { createGetCandles } from './get-candles';
import { createGetCandlesStatus } from './get-candles-status';
import { createGetMarketConfigById } from './get-market-config-by-id';

export const createMarketQueries = (storeService: StoreService) => ({
  getMarketConfigById: createGetMarketConfigById(storeService),
  getCandles: createGetCandles(storeService),
  getCandlesStatus: createGetCandlesStatus(storeService),
});

export type MarketQueries = ReturnType<typeof createMarketQueries>;
