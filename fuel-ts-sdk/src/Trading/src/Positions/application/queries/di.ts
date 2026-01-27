import type { GetAllPositionsQueryDependencies } from './getAllPositions';
import { createGetAllLatestPositionsQuery } from './getAllPositions';
import type { GetPositionByIdQueryDependencies } from './getPositionsById';
import { createGetPositionByIdQuery } from './getPositionsById';
import type { IsPositionOpenQueryDependencies } from './isPositionOpen';
import { createIsPositionOpenQuery } from './isPositionOpen';

export type PositionsQueriesDependencies = GetAllPositionsQueryDependencies &
  GetPositionByIdQueryDependencies &
  IsPositionOpenQueryDependencies;

export const createPositionQueries = (deps: PositionsQueriesDependencies) => ({
  getPositionById: createGetPositionByIdQuery(deps),
  isPositionOpen: createIsPositionOpenQuery(deps),
  getAllLatestPositions: createGetAllLatestPositionsQuery(deps),
});

export type PositionsQueries = ReturnType<typeof createPositionQueries>;
