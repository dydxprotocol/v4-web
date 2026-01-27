import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { PositionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../domain';
import { selectLatestPositionByStableId } from '../../infrastructure';

export interface GetPositionByIdQueryDependencies {
  storeService: StoreService;
}

export const createGetPositionByIdQuery =
  (deps: GetPositionByIdQueryDependencies) =>
  (stableId: PositionStableId): PositionEntity | undefined =>
    selectLatestPositionByStableId(deps.storeService.getState(), stableId);
