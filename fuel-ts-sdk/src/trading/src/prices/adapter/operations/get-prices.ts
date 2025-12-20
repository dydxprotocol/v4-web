import type { Price as GraphQLPrice } from '@/generated/graphql';
import { AssetId, assetId, priceId } from '@/shared/types';
import type { GraphQLClient } from 'graphql-request';

import { PriceSchema, type Price } from '../../domain';
import type { GetPricesOptions } from '../../port';
import { GET_PRICES_QUERY } from './get-prices.query';

export const getPrices =
  (client: GraphQLClient) =>
  async (options: GetPricesOptions = {}): Promise<Price[]> => {
    const { limit = 100, offset = 0, orderBy = 'TIMESTAMP_DESC' } = options;

    const where = buildWhereClause(options);

    const data = await client.request<{ prices: { nodes: GraphQLPrice[] } }>(GET_PRICES_QUERY, {
      limit,
      offset,
      where,
      orderBy: [orderBy],
    });

    return data.prices.nodes.map(toDomainPrice);
  };

interface PriceWhereClause {
  asset_eq?: AssetId;
}

function buildWhereClause(options: GetPricesOptions) {
  const { asset } = options;

  const where: PriceWhereClause = {};

  if (asset) {
    where.asset_eq = asset;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

function toDomainPrice(gql: GraphQLPrice): Price {
  return PriceSchema.parse({
    id: priceId(gql.id),
    asset: assetId(gql.asset),
    price: BigInt(gql.price),
    timestamp: gql.timestamp,
  });
}
