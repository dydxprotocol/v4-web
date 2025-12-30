import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import type { CandleInterval } from '../../domain';
import { candles } from '../../infrastructure';

export const createFetchCandlesCommand =
  (store: StoreService) =>
  async (asset: AssetId, interval: CandleInterval, limit = 100) => {
    await store.dispatch(candles.thunks.fetchCandles({ asset, interval, limit })).unwrap();
  };
