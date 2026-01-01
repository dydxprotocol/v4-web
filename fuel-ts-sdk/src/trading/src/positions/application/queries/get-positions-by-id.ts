import type { StoreService } from '@/shared/lib/store-service';
import type { PositionStableId } from '@/shared/types';
import type { Position } from '../../domain';
import { selectLatestPositionByKeyId } from '../../infrastructure';

export const createGetPositionById =
  (storeService: StoreService) =>
  (stableId: PositionStableId): Position | undefined =>
    selectLatestPositionByKeyId(storeService.getState(), stableId);
