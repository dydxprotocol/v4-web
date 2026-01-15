import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { RequestStatus } from '@sdk/shared/lib/redux';
import type { AssetId } from '@sdk/shared/types';
import type { CandleInterval } from '../../domain';
import { selectCandlesFetchStatus } from '../../infrastructure';

export const createGetCandlesStatus =
  (storeService: StoreService) =>
  (asset: AssetId, interval: CandleInterval): RequestStatus => {
    return selectCandlesFetchStatus(storeService.getState(), asset, interval);
  };
