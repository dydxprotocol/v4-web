import type { StoreService } from '@/shared/lib/store-service';
import type { AssetId } from '@/shared/types';
import type { Asset } from '../../domain';
import { selectAssetById } from '../../infrastructure';

export const createGetAssetByIdQuery =
  (storeService: StoreService) =>
  (assetId: AssetId): Asset | undefined =>
    selectAssetById(storeService.getState(), assetId);
