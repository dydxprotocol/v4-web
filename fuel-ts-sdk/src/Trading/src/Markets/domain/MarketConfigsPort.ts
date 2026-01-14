import type { AssetId } from '@/shared/types';
import type { MarketConfigEntity } from './MarketConfigEntity';

/**
 * MarketConfigRepository - Port (interface) defining market config data access contract
 */
export interface MarketConfigRepository {
  getMarketConfig(assetId: AssetId): Promise<MarketConfigEntity>;
}
