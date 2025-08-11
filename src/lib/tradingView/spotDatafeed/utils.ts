import { DateTime } from 'luxon';
import type {
  Bar,
  LibrarySymbolInfo,
  ResolutionString,
  Timezone,
} from 'public/tradingview/charting_library';

import { RESOLUTION_TO_SPOT_INTERVAL_MAP } from '@/constants/candles';

import { objectKeys } from '@/lib/objectHelpers';

import { SpotCandleData, SpotCandleServiceInterval } from './types';

const timezone = DateTime.local().get('zoneName') as unknown as Timezone;

// Convert TradingView resolution to spot candle service interval
export const resolutionToSpotInterval = (
  resolution: ResolutionString
): SpotCandleServiceInterval => {
  return RESOLUTION_TO_SPOT_INTERVAL_MAP[resolution] ?? '1D';
};

// Supported resolutions for spot charts
export const SPOT_SUPPORTED_RESOLUTIONS = objectKeys(RESOLUTION_TO_SPOT_INTERVAL_MAP);

// Transform single candle item for chart consumption
export const transformSpotCandleForChart = (candle: SpotCandleData): Bar => {
  return {
    time: candle.t * 1000, // Convert to milliseconds
    open: candle.o,
    high: candle.h,
    low: candle.l,
    close: candle.c,
    volume: candle.v_usd,
  };
};

// Transform array of candle data for chart consumption
export const transformSpotCandlesForChart = (candles: SpotCandleData[]): Bar[] => {
  return candles.map(transformSpotCandleForChart);
};

// Create symbol info for spot tokens
export const createSpotSymbolInfo = (tokenSymbol: string): LibrarySymbolInfo => {
  return {
    ticker: tokenSymbol,
    name: tokenSymbol,
    description: tokenSymbol,
    type: 'crypto',
    session: '24x7',
    timezone,
    exchange: 'Spot',
    listed_exchange: 'Spot',
    minmov: 1,
    pricescale: 1000000,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    has_seconds: true,
    visible_plots_set: 'ohlcv' as const,
    supported_resolutions: SPOT_SUPPORTED_RESOLUTIONS,
    volume_precision: 2,
    data_status: 'streaming' as const,
    format: 'price' as const,
  };
};
