import type { StoreService } from '@/shared/lib/StoreService';
import type { MarketConfigId } from '@/shared/types';
import type { MarketConfigEntity } from '../../domain';
import { selectMarketConfigById } from '../../infrastructure';

export const createGetMarketConfigById =
  (storeService: StoreService) =>
  (marketConfigId: MarketConfigId): MarketConfigEntity =>
    selectMarketConfigById(storeService.getState(), marketConfigId);
