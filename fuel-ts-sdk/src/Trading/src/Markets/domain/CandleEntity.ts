import type { AssetId, CandleId } from '@sdk/shared/types';

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
  openPrice: string;
  closePrice: string;
  highPrice: string;
  lowPrice: string;
  startedAt: number;
}
