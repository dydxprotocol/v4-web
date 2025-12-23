import type { AssetId } from '@/shared/types';
import type { CurrentPrice } from './domain';

/**
 * Query options for fetching current prices
 */
export interface GetCurrentPricesOptions {
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
 * CurrentPriceRepository - Port (interface) defining current price data access contract
 */
export interface CurrentPriceRepository {
  getCurrentPrices(options?: GetCurrentPricesOptions): Promise<CurrentPrice[]>;
}

