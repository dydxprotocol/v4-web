import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { Candle, CandleInterval } from '../../domain';
import { selectCandlesByAssetAndInterval } from '../../infrastructure';

export const createGetCandles =
  (storeService: StoreService) =>
  (asset: AssetId, interval: CandleInterval, limit = 1000): Candle[] =>
    selectCandlesByAssetAndInterval(storeService.getState(), asset, interval, limit);
