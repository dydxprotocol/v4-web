import { StoreService } from '@/shared/lib/store-service';
import { MarketConfigId } from '@/shared/types';
import { selectMarketConfigById } from '../../infrastructure';

export const createGetMarketConfigById =
  (storeService: StoreService) => (marketConfigId: MarketConfigId) =>
    selectMarketConfigById(storeService.getState(), marketConfigId);
