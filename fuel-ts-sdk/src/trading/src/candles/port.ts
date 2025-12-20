import type { AssetId } from '@/shared/types';
import type { Candle } from './domain';

/**
 * Candle interval options
 */
export type CandleInterval = 'D1' | 'H1' | 'H4' | 'M1' | 'M5' | 'M15' | 'M30';

/**
 * Query options for fetching candles
 */
export interface GetCandlesOptions {
  interval: CandleInterval;
  limit?: number;
  offset?: number;
  /**
   * Filter by asset identifier (raw string as returned by the subgraph).
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
