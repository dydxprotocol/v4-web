import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { PositionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../domain';
import { selectLatestPositionByKeyId } from '../../infrastructure';

export const createGetPositionById =
  (storeService: StoreService) =>
  (stableId: PositionStableId): PositionEntity | undefined =>
    selectLatestPositionByKeyId(storeService.getState(), stableId);
