import type { GraphQLClient } from 'graphql-request';
import { OraclePrice } from '@sdk/shared/models/decimals';
import type { AssetId } from '@sdk/shared/types';
import { assetId, assetPriceId } from '@sdk/shared/types';
import type { AssetPriceEntity } from '../../../domain';
import { AssetPriceEntitySchema } from '../../../domain';
import { GET_ASSET_PRICES_BY_IDS_QUERY } from './getAssetPricesByIds.gql';

interface AssetPricesResponse {
  prices: Array<{
    asset: string;
    price: string;
    timestamp: number;
  }>;
}

export const getAssetPricesByIds =
  (client: GraphQLClient) =>
  async (assetIds: AssetId[]): Promise<AssetPriceEntity[]> => {
    const response = await client.request<AssetPricesResponse>(GET_ASSET_PRICES_BY_IDS_QUERY, {
      assetIds,
    });

    return response.prices.map((priceData) =>
      AssetPriceEntitySchema.parse({
        id: assetPriceId(`${priceData.asset}-${priceData.timestamp}`),
        assetId: assetId(priceData.asset),
        value: OraclePrice.fromBigInt(BigInt(priceData.price)),
        timestamp: priceData.timestamp,
      })
    );
  };
