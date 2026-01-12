import type { StoreService } from '@/shared/lib/store-service';
import type { Asset } from '../../domain';
import { selectBaseAsset } from '../../infrastructure';

export const createGetBaseAssetQuery = (storeService: StoreService) => (): Asset | undefined =>
  selectBaseAsset(storeService.getState());
