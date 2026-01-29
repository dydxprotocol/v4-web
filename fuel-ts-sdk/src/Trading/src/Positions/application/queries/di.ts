import type { GetAllPositionsQueryDependencies } from './getAllPositions';
import { createGetAllLatestPositionsQuery } from './getAllPositions';
import type { GetPositionSizeInQuoteAssetQueryDependencies } from './getPositionSizeInQuoteAsset';
import { createGetPositionSizeInQuoteAssetQuery } from './getPositionSizeInQuoteAsset';
import type { GetPositionByIdQueryDependencies } from './getPositionsById';
import { createGetPositionByIdQuery } from './getPositionsById';
import type { IsPositionOpenQueryDependencies } from './isPositionOpen';
import { createIsPositionOpenQuery } from './isPositionOpen';

export type PositionsQueriesDependencies = GetAllPositionsQueryDependencies &
  GetPositionByIdQueryDependencies &
  IsPositionOpenQueryDependencies &
  GetPositionSizeInQuoteAssetQueryDependencies;

export const createPositionQueries = (deps: PositionsQueriesDependencies) => ({
  getPositionById: createGetPositionByIdQuery(deps),
  isPositionOpen: createIsPositionOpenQuery(deps),
  getAllLatestPositions: createGetAllLatestPositionsQuery(deps),
  getPositionSizeInQuoteAsset: createGetPositionSizeInQuoteAssetQuery(deps),
});

export type PositionsQueries = ReturnType<typeof createPositionQueries>;
