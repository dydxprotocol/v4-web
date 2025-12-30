import type { GraphQLClient } from 'graphql-request';
import { OraclePrice } from '@/shared/models/decimals';
import { AssetId, assetId, assetPriceId } from '@/shared/types';
import type { GetAssetPricesOptions } from '../../../domain';
import { type AssetPrice, AssetPriceSchema } from '../../../domain';
import { GET_CURRENT_ASSET_PRICES_QUERY } from './operations/get-current-asset-prices.query';

interface GraphQLCurrentPrice {
  asset: string;
  price: string;
  timestamp: number;
}

export const getCurrentAssetPrices =
  (client: GraphQLClient) =>
  async (options: GetAssetPricesOptions = {}): Promise<AssetPrice[]> => {
    const { limit = 100, offset = 0, orderBy = 'TIMESTAMP_DESC' } = options;

    const where = buildWhereClause(options);

    const data = await client.request<{
      currentPrices: { nodes: GraphQLCurrentPrice[] };
    }>(GET_CURRENT_ASSET_PRICES_QUERY, {
      limit,
      offset,
      where,
      orderBy: [orderBy],
    });

    return data.currentPrices.nodes.map(toDomainAssetPrice);
  };

interface AssetPriceWhereClause {
  asset_eq?: AssetId;
}

function buildWhereClause(options: GetAssetPricesOptions) {
  const { asset } = options;

  const where: AssetPriceWhereClause = {};

  if (asset) {
    where.asset_eq = asset;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

function toDomainAssetPrice(gql: GraphQLCurrentPrice): AssetPrice {
  return AssetPriceSchema.parse({
    id: assetPriceId(`${gql.asset}-${gql.timestamp}`),
    assetId: assetId(gql.asset),
    value: OraclePrice.fromBigInt(BigInt(gql.price)),
    timestamp: gql.timestamp,
  });
}
