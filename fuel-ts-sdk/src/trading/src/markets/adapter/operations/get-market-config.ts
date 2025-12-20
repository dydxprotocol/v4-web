import { PercentageValue } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';
import type { GraphQLClient } from 'graphql-request';

import type { MarketConfig } from '../../domain';

export const getMarketConfig =
  (client: GraphQLClient) =>
  async (assetId: AssetId): Promise<MarketConfig> => {
    return {
      initialMarginFraction: 50000000000000000n,
      maintenanceMarginFraction: PercentageValue.fromBigInt(25000000000000000n),
      tickSizeDecimals: 2,
      stepSizeDecimals: 4,
    };
  };
