import type { StoreService } from '@/shared/lib/store-service';
import type { Asset } from '../../domain';
import { selectWatchedAsset } from '../../infrastructure';

export const createGetWatchedAssetQuery = (storeService: StoreService) => (): Asset | undefined =>
  selectWatchedAsset(storeService.getState());
