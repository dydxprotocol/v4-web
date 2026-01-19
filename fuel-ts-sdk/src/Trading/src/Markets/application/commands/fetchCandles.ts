import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { CandleInterval } from '../../domain';
import { candles } from '../../infrastructure';

export const createFetchCandlesCommand =
  (store: StoreService) =>
  async (asset: AssetId, interval: CandleInterval, limit = 100) => {
    await store.dispatch(
      candles.api.endpoints.getCandles.initiate({ asset, interval, limit }, { forceRefetch: true })
    );
  };
