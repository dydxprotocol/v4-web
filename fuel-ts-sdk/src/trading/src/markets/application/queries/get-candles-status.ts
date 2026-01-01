import type { RequestStatus } from '@/shared/lib/redux';
import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import type { CandleInterval } from '../../domain';
import { selectCandlesFetchStatus } from '../../infrastructure';

export const createGetCandlesStatus =
  (storeService: StoreService) =>
  (asset: AssetId, interval: CandleInterval): RequestStatus => {
    return selectCandlesFetchStatus(storeService.getState(), asset, interval);
  };
