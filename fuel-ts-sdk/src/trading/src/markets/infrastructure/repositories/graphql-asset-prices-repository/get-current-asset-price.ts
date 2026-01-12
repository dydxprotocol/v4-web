import type { GraphQLClient } from 'graphql-request';
import { OraclePrice } from '@/shared/models/decimals';
import { assetId, assetPriceId } from '@/shared/types';
import { type AssetPrice, AssetPriceSchema } from '../../../domain';
import { GET_CURRENT_ASSET_PRICES_QUERY } from './get-current-asset-price.gql';

interface GraphQLCurrentPrice {
  asset: string;
  price: string;
  timestamp: number;
}

export const getCurrentAssetPrice =
  (client: GraphQLClient) =>
  async (asset: string): Promise<AssetPrice | undefined> => {
    const data = await client.request<{
      currentPrices: { nodes: GraphQLCurrentPrice[] };
    }>(GET_CURRENT_ASSET_PRICES_QUERY, {
      asset,
    });

    const dto = data.currentPrices.nodes.at(0);
    if (!dto) return;

    return toDomainAssetPrice(dto);
  };

function toDomainAssetPrice(gql: GraphQLCurrentPrice): AssetPrice {
  return AssetPriceSchema.parse({
    id: assetPriceId(`${gql.asset}-${gql.timestamp}`),
    assetId: assetId(gql.asset),
    value: OraclePrice.fromBigInt(BigInt(gql.price)).value,
    timestamp: gql.timestamp,
  });
}
