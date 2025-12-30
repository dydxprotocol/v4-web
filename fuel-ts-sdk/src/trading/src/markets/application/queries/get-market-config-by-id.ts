import type { StoreService } from '@/shared/lib/store-service';
import type { MarketConfigId } from '@/shared/types';
import { selectMarketConfigById } from '../../infrastructure';

export const createGetMarketConfigById =
  (storeService: StoreService) => (marketConfigId: MarketConfigId) =>
    selectMarketConfigById(storeService.getState(), marketConfigId);
