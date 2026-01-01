import type { StoreService } from '@/shared/lib/store-service';
import type { MarketConfigId } from '@/shared/types';
import type { MarketConfig } from '../../domain';
import { selectMarketConfigById } from '../../infrastructure';

export const createGetMarketConfigById =
  (storeService: StoreService) =>
  (marketConfigId: MarketConfigId): MarketConfig =>
    selectMarketConfigById(storeService.getState(), marketConfigId);
