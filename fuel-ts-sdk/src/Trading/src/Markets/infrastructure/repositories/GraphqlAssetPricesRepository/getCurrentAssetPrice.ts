import type { GraphQLClient } from 'graphql-request';
import { type AssetPriceEntity, AssetPriceEntitySchema } from '../../../domain';
import { GET_CURRENT_ASSET_PRICES_QUERY } from './getCurrentAssetPrice.gql';

interface GraphQLCurrentPrice {
  asset: string;
  price: string;
  timestamp: number;
}

export const getCurrentAssetPrice =
  (client: GraphQLClient) =>
  async (asset: string): Promise<AssetPriceEntity | undefined> => {
    const data = await client.request<{
      currentPrices: { nodes: GraphQLCurrentPrice[] };
    }>(GET_CURRENT_ASSET_PRICES_QUERY, {
      asset,
    });

    const dto = data.currentPrices.nodes.at(0);
    if (!dto) return;

    return toDomainAssetPrice(dto);
  };

function toDomainAssetPrice(gql: GraphQLCurrentPrice): AssetPriceEntity {
  return AssetPriceEntitySchema.parse({
    id: `${gql.asset}-${gql.timestamp}`,
    assetId: gql.asset,
    value: gql.price,
    timestamp: gql.timestamp,
  });
}
