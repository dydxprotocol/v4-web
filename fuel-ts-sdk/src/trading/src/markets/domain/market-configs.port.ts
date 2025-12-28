import type { AssetId } from '@/shared/types';
import type { MarketConfig } from './market-configs.types';

/**
 * MarketConfigRepository - Port (interface) defining market config data access contract
 */
export interface MarketConfigRepository {
  getMarketConfig(assetId: AssetId): Promise<MarketConfig>;
}
