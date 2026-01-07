import type { StoreService } from '@/shared/lib/store-service';
import type { Asset } from '../../domain';
import { selectAllAssets } from '../../infrastructure';

export const createGetAllAssetsQuery = (storeService: StoreService) => (): Asset[] =>
  selectAllAssets(storeService.getState());
