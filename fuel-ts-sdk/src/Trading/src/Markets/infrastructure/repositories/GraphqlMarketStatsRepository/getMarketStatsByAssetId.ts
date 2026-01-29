import type { AssetId } from '@sdk/shared/types';
import type { GraphQLClient } from 'graphql-request';
import {
  type MarketStatsEntity,
  MarketStatsEntitySchema,
  OpenInterest,
  TradeVolume,
} from '../../../domain';
import {
  GET_MARKET_STATS_QUERY,
  type GetMarketStatsQueryResult,
  type GetMarketStatsQueryVariables,
} from './getMarketStatsByAssetId.gql';

export interface GetMarketStatsByAssetIdActionDependencies {
  graphqlClient: GraphQLClient;
}

export const createGetMarketStatsByAssetIdAction =
  (deps: GetMarketStatsByAssetIdActionDependencies) =>
  async (assetId: AssetId): Promise<MarketStatsEntity | undefined> => {
    const data = await deps.graphqlClient.request<
      GetMarketStatsQueryResult,
      GetMarketStatsQueryVariables
    >(GET_MARKET_STATS_QUERY, {
      indexAssetId: assetId,
    });

    const openInterest = data.openInterests.nodes.at(0);
    const tradeVolume = data.tradeVolume24Hs.nodes.at(0);

    if (!openInterest || !tradeVolume) return;

    return MarketStatsEntitySchema.parse({
      assetId,
      openInterestLong: OpenInterest.fromBigIntString(openInterest.openInterestLong),
      openInterestShort: OpenInterest.fromBigIntString(openInterest.openInterestShort),
      volume24h: TradeVolume.fromBigIntString(tradeVolume.tradeVolume),
      priceChange24h: null,
    });
  };
