import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import type { Candle, CandleInterval } from '../../domain';
import { selectCandlesByAssetAndInterval } from '../../infrastructure';

export const createGetCandles =
  (storeService: StoreService) =>
  (asset: AssetId, interval: CandleInterval, limit = 100): Candle[] =>
    selectCandlesByAssetAndInterval(storeService.getState(), asset, interval, limit);
