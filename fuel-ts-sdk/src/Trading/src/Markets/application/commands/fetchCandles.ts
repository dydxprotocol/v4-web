import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { CandleInterval } from '../../domain';
import { candlesApi } from '../../infrastructure';

export const createFetchCandlesCommand =
  (store: StoreService) =>
  async (asset: AssetId, interval: CandleInterval, limit = 1000) => {
    await store.dispatch(
      candlesApi.endpoints.getCandles.initiate({ asset, interval, limit }, { forceRefetch: true })
    );
  };
