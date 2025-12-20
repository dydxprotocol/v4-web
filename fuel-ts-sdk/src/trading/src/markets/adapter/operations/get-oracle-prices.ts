import { OraclePrice } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';
import type { GraphQLClient } from 'graphql-request';

import { GET_ORACLE_PRICES_QUERY } from './get-oracle-price.query';

interface OraclePricesResponse {
  prices: Array<{
    asset: string;
    price: string;
    timestamp: number;
  }>;
}

export const getOraclePrices =
  (client: GraphQLClient) =>
  async (assetIds: AssetId[]): Promise<Map<AssetId, OraclePrice>> => {
    const response = await client.request<OraclePricesResponse>(GET_ORACLE_PRICES_QUERY, {
      assetIds,
    });

    const priceMap = new Map<AssetId, OraclePrice>();

    for (const priceData of response.prices) {
      priceMap.set(priceData.asset as AssetId, OraclePrice.fromBigInt(BigInt(priceData.price)));
    }

    return priceMap;
  };
