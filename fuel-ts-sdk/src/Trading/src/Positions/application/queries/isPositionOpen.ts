import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { PositionStableId } from '@sdk/shared/types';
import { selectLatestPositionByStableId } from '../../infrastructure';

export interface IsPositionOpenQueryDependencies {
  storeService: StoreService;
}

export const createIsPositionOpenQuery =
  (deps: IsPositionOpenQueryDependencies) => (positionStableId: PositionStableId) => {
    const position = deps.storeService.select((s) =>
      selectLatestPositionByStableId(s, positionStableId)
    );

    if (!position) return false;

    return position?.size.value !== '0';
  };
