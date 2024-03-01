import { ResolutionString } from 'public/tradingview/charting_library';

import { timeUnits } from './time';

export interface Candle {
  startedAt: string;
  ticker: string;
  resolution: CandleResolution;
  low: string;
  high: string;
  open: string;
  close: string;
  baseTokenVolume: string;
  usdVolume: string;
  trades: number;
  startingOpenInterest: string;
}

export interface TradingViewBar {
  time: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

export interface TradingViewSymbol {
  description: string;
  exchange: string;
  full_name: string;
  symbol: string;
  type: string;
}

/**
 * @description Resolution values used with Indexer API's Candles endpoints
 */
export enum CandleResolution {
  ONE_MINUTE = '1MIN',
  FIVE_MINUTES = '5MINS',
  FIFTEEN_MINUTES = '15MINS',
  THIRTY_MINUTES = '30MINS',
  ONE_HOUR = '1HOUR',
  FOUR_HOURS = '4HOURS',
  ONE_DAY = '1DAY',
}

/**
 * @description ResolutionStrings used with TradingView's charting library mapped to CandleResolution
 */
export const RESOLUTION_MAP = {
  '1': CandleResolution.ONE_MINUTE,
  '5': CandleResolution.FIVE_MINUTES,
  '15': CandleResolution.FIFTEEN_MINUTES,
  '30': CandleResolution.THIRTY_MINUTES,
  '60': CandleResolution.ONE_HOUR,
  '240': CandleResolution.FOUR_HOURS,
  '1D': CandleResolution.ONE_DAY,
} as Record<ResolutionString, CandleResolution>;

export const DEFAULT_RESOLUTION = '1D';

/**
 * @description Chart Configs mapped to ResolutionStrings
 */
export const RESOLUTION_CHART_CONFIGS = {
  '1': { defaultRange: timeUnits.hour },
  '5': { defaultRange: 5 * timeUnits.hour },
  '15': { defaultRange: 15 * timeUnits.hour },
  '30': { defaultRange: 30 * timeUnits.hour },
  '60': { defaultRange: 3 * timeUnits.day },
  '240': { defaultRange: 12 * timeUnits.day },
  '1D': { defaultRange: 2 * timeUnits.month },
} as Record<ResolutionString, { defaultRange: number }>;
