import type { StoreService } from '@/shared/lib/StoreService';
import type { PositionStableId } from '@/shared/types';
import type { PositionEntity } from '../../domain';
import { selectLatestPositionByKeyId } from '../../infrastructure';

export const createGetPositionById =
  (storeService: StoreService) =>
  (stableId: PositionStableId): PositionEntity | undefined =>
    selectLatestPositionByKeyId(storeService.getState(), stableId);
