import type { AssetId } from '@/shared/types';
import type { Price } from './domain';

/**
 * Query options for fetching prices
 */
export interface GetPricesOptions {
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
 * PriceRepository - Port (interface) defining price data access contract
 */
export interface PriceRepository {
  getPrices(options?: GetPricesOptions): Promise<Price[]>;
}
