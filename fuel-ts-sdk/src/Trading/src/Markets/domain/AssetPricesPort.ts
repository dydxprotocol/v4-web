import type { AssetId } from '@sdk/shared/types';
import type { AssetPriceEntity } from './AssetPriceEntity';

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
   * Filter by timestamp less than or equal to this value (unix seconds).
   */
  timestampLte?: number;
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
  getAssetPricesByIds(assetIds: AssetId[]): Promise<AssetPriceEntity[]>;

  /**
   * Get current/latest price
   */
  getCurrentAssetPrice(assetId: AssetId): Promise<AssetPriceEntity | undefined>;

  /**
   * Get historical asset prices with optional filtering
   */
  getHistoricalAssetPrices(options?: GetAssetPricesOptions): Promise<AssetPriceEntity[]>;
}
