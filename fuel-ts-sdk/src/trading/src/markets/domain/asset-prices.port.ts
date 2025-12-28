import type { AssetId } from '@/shared/types';
import type { AssetPrice } from './asset-prices.types';

/**
 * Query options for fetching asset prices
 */
export interface GetAssetPricesOptions {
  limit?: number;
  offset?: number;
  /**
   * Filter by asset identifier.
   */
  asset?: AssetId;
  /**
   * Default ordering is by timestamp descending.
   */
  orderBy?: 'TIMESTAMP_ASC' | 'TIMESTAMP_DESC';
}

/**
 * AssetPriceRepository - Port (interface) defining asset price data access contract
 */
export interface AssetPriceRepository {
  /**
   * Get latest prices for multiple assets (oracle batch query)
   */
  getAssetPricesByIds(assetIds: AssetId[]): Promise<AssetPrice[]>;

  /**
   * Get current/latest prices with optional filtering
   */
  getCurrentAssetPrices(options?: GetAssetPricesOptions): Promise<AssetPrice[]>;

  /**
   * Get historical asset prices with optional filtering
   */
  getHistoricalAssetPrices(options?: GetAssetPricesOptions): Promise<AssetPrice[]>;
}
