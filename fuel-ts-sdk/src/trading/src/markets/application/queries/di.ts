import { StoreService } from '@/shared/lib/store-service';
import { createGetMarketConfigById } from './get-market-config-by-id';

export const createMarketQueries = (storeService: StoreService) => ({
  getMarketConfigById: createGetMarketConfigById(storeService),
});

export type MarketQueries = ReturnType<typeof createMarketQueries>;
