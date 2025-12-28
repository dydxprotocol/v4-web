import type { AssetId } from '@/shared/types';
import type { Candle, CandleInterval } from './candles.types';

/**
 * Query options for fetching candles
 */
export interface GetCandlesOptions {
  interval: CandleInterval;
  limit?: number;
  offset?: number;
  /**
   * Filter by asset identifier.
   */
  asset?: AssetId;
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
