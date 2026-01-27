import type { StoreService } from '@sdk/shared/lib/StoreService';
import { monomemo } from '@sdk/shared/lib/memo';
import type { PositionEntity } from '../../domain';
import { selectAllPositions } from '../../infrastructure';

export interface GetAllPositionsQueryDependencies {
  storeService: StoreService;
}

export const createGetAllLatestPositionsQuery = (deps: GetAllPositionsQueryDependencies) => {
  const positionsGetter = () => deps.storeService.select(selectAllPositions);

  const getAllLatestPositions = monomemo((positions: PositionEntity[]) =>
    positions.filter((p) => p.isLatest)
  );

  return () => getAllLatestPositions(positionsGetter());
};
