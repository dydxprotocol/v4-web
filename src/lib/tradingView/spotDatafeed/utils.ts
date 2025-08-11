import type { LibrarySymbolInfo, ResolutionString } from 'public/tradingview/charting_library';

import { TradingViewChartBar } from '@/constants/candles';

import { objectKeys } from '@/lib/objectHelpers';

import { SpotCandleData, SpotCandleServiceInterval } from './types';

// Resolution mapping for spot candle service
const RESOLUTION_TO_SPOT_INTERVAL_MAP = {
  '1S': '1S',
  '5S': '5S',
  '15S': '15S',
  '30S': '30S',
  '1': '1',
  '5': '5',
  '15': '15',
  '30': '30',
  '60': '60',
  '240': '240',
  '720': '720',
  '1D': '1D',
  '1W': '7D',
} as Record<ResolutionString, SpotCandleServiceInterval>;

// Convert TradingView resolution to spot candle service interval
export const resolutionToSpotInterval = (
  resolution: ResolutionString
): SpotCandleServiceInterval => {
  return RESOLUTION_TO_SPOT_INTERVAL_MAP[resolution] ?? '1D';
};

// Supported resolutions for spot charts
export const SPOT_SUPPORTED_RESOLUTIONS = objectKeys(RESOLUTION_TO_SPOT_INTERVAL_MAP);

// Transform single candle item for chart consumption
export const transformSpotCandleForChart = (candle: SpotCandleData): TradingViewChartBar => {
  return {
    time: candle.t * 1000, // Convert to milliseconds
    open: candle.o,
    high: candle.h,
    low: candle.l,
    close: candle.c,
    volume: candle.v_usd, // Use USD volume for display
    // Additional properties for TradingViewChartBar
    tradeOpen: candle.o,
    tradeClose: candle.c,
    tradeLow: candle.l,
    tradeHigh: candle.h,
    trades: 1, // Default value since spot data doesn't track trade count
    assetVolume: candle.v,
    usdVolume: candle.v_usd,
  };
};

// Transform array of candle data for chart consumption
export const transformSpotCandlesForChart = (candles: SpotCandleData[]): TradingViewChartBar[] => {
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
    timezone: 'Etc/UTC' as const,
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
