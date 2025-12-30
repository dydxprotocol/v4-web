import type { AssetId, CandleId } from '@/shared/types';

/**
 * Candle interval options
 */
export type CandleInterval = 'D1' | 'H1' | 'H4' | 'M1' | 'M5' | 'M15' | 'M30';

/**
 * Candle - OHLC data point
 */
export interface Candle {
  id: CandleId;
  asset: AssetId;
  interval: CandleInterval;
  closePrice: bigint;
  highPrice: bigint;
  lowPrice: bigint;
  startedAt: number;
}
