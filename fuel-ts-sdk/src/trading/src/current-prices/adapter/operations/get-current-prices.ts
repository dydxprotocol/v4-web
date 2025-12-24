import type { GraphQLClient } from 'graphql-request';
import type { CurrentPrice as GraphQLCurrentPrice } from '@/generated/graphql';
import { AssetId, assetId } from '@/shared/types';
import { type CurrentPrice, CurrentPriceSchema } from '../../domain';
import type { GetCurrentPricesOptions } from '../../port';
import { GET_CURRENT_PRICES_QUERY } from './get-current-prices.query';

export const getCurrentPrices =
  (client: GraphQLClient) =>
  async (options: GetCurrentPricesOptions = {}): Promise<CurrentPrice[]> => {
    const { limit = 100, offset = 0, orderBy = 'TIMESTAMP_DESC' } = options;

    const where = buildWhereClause(options);

    const data = await client.request<{
      currentPrices: { nodes: GraphQLCurrentPrice[] };
    }>(GET_CURRENT_PRICES_QUERY, {
      limit,
      offset,
      where,
      orderBy: [orderBy],
    });

    return data.currentPrices.nodes.map(toDomainCurrentPrice);
  };

interface CurrentPriceWhereClause {
  asset_eq?: AssetId;
}

function buildWhereClause(options: GetCurrentPricesOptions) {
  const { asset } = options;

  const where: CurrentPriceWhereClause = {};

  if (asset) {
    where.asset_eq = asset;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

function toDomainCurrentPrice(gql: GraphQLCurrentPrice): CurrentPrice {
  return CurrentPriceSchema.parse({
    asset: assetId(gql.asset),
    price: BigInt(gql.price),
    timestamp: gql.timestamp,
  });
}
