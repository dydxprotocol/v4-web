import type { OraclePrice } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';

import type { MarketConfig } from './domain';

export type { MarketConfig };

export interface MarketRepository {
  getMarketConfig(assetId: AssetId): Promise<MarketConfig>;
  getOraclePrice(assetId: AssetId): Promise<OraclePrice>;
  getOraclePrices(assetIds: AssetId[]): Promise<Map<AssetId, OraclePrice>>;
}
