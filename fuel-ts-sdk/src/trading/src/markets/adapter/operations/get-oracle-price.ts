import { OraclePrice } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';
import type { GraphQLClient } from 'graphql-request';

import { GET_ORACLE_PRICE_QUERY } from './get-oracle-price.query';

interface OraclePriceResponse {
  price: {
    asset: string;
    price: string;
    timestamp: number;
  } | null;
}

export const getOraclePrice =
  (client: GraphQLClient) =>
  async (assetId: AssetId): Promise<OraclePrice> => {
    const response = await client.request<OraclePriceResponse>(GET_ORACLE_PRICE_QUERY, {
      assetId,
    });

    if (!response.price) {
      throw new Error(`Oracle price not found for asset: ${assetId}`);
    }

    return OraclePrice.fromBigInt(BigInt(response.price.price));
  };
