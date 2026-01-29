import type { MarketStatsRepository } from '../../../domain';
import type { GetMarketStatsByAssetIdActionDependencies } from './getMarketStatsByAssetId';
import { createGetMarketStatsByAssetIdAction } from './getMarketStatsByAssetId';

export type GraphqlMarketStatsRepositoryDependencies = GetMarketStatsByAssetIdActionDependencies;

export const createGraphqlMarketStatsRepository = (
  deps: GraphqlMarketStatsRepositoryDependencies
): MarketStatsRepository => ({
  getMarketStatsByAssetId: createGetMarketStatsByAssetIdAction(deps),
});
