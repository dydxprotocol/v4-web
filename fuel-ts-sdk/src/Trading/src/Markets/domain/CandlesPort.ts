import type { AssetId } from '@/shared/types';
import type { Candle, CandleInterval } from './CandleEntity';

/**
 * Query options for fetching candles
 */
export interface GetCandlesOptions {
  limit?: number;
  offset?: number;
  /**
   * Filter by asset identifier.
   */
  asset?: AssetId;
  /**
   * Candle interval to fetch (required).
   */
  interval: CandleInterval;
  /**
   * Default ordering is by startedAt descending.
   */
  orderBy?: 'STARTED_AT_ASC' | 'STARTED_AT_DESC';
}

/**
 * CandleRepository - Port (interface) defining candle data access contract
 */
export interface CandleRepository {
  getCandles(options: GetCandlesOptions): Promise<Candle[]>;
}
