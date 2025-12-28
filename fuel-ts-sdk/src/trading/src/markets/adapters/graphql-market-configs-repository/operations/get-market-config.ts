import type { GraphQLClient } from 'graphql-request';
import { PercentageValue } from '@/shared/models/decimals';
import { type AssetId, marketConfigId } from '@/shared/types';
import { type MarketConfig, MarketConfigSchema } from '../../../domain';
import { GET_MARKET_CONFIG_QUERY } from './get-market-config.query';

interface MarketConfigResponse {
  market: {
    asset: string;
    initialMarginFraction: string;
    maintenanceMarginFraction: string;
    tickSizeDecimals: number;
    stepSizeDecimals: number;
  } | null;
}

export const getMarketConfig =
  (client: GraphQLClient) =>
  async (assetId: AssetId): Promise<MarketConfig> => {
    const response = await client.request<MarketConfigResponse>(GET_MARKET_CONFIG_QUERY, {
      assetId,
    });

    if (!response.market) {
      throw new Error(`Market config not found for asset: ${assetId}`);
    }

    const id = marketConfigId(assetId);

    return MarketConfigSchema.parse({
      id,
      asset: assetId,
      initialMarginFraction: PercentageValue.fromBigInt(
        BigInt(response.market.initialMarginFraction)
      ),
      maintenanceMarginFraction: PercentageValue.fromBigInt(
        BigInt(response.market.maintenanceMarginFraction)
      ),
      tickSizeDecimals: response.market.tickSizeDecimals,
      stepSizeDecimals: response.market.stepSizeDecimals,
    });
  };
