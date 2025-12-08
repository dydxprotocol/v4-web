import { DateTime } from 'luxon';
import type {
  LibrarySymbolInfo,
  ResolutionString,
  Timezone,
} from 'public/tradingview/charting_library';

import { RESOLUTION_TO_SPOT_INTERVAL_MAP, TradingViewBar } from '@/constants/candles';
import { SMALL_USD_DECIMALS } from '@/constants/numbers';

import { SpotApiBarObject, SpotApiBarsResolution } from '@/clients/spotApi';
import { objectKeys } from '@/lib/objectHelpers';

const timezone = DateTime.local().get('zoneName') as unknown as Timezone;

// Convert TradingView resolution to spot bars resolution
export const resolutionToSpotInterval = (resolution: ResolutionString): SpotApiBarsResolution => {
  return RESOLUTION_TO_SPOT_INTERVAL_MAP[resolution] ?? '1D';
};

// Supported resolutions for spot charts
export const SPOT_SUPPORTED_RESOLUTIONS = objectKeys(RESOLUTION_TO_SPOT_INTERVAL_MAP);

// Transform single bar item for chart consumption
export const transformSpotCandleForChart = (bar: SpotApiBarObject): TradingViewBar => {
  return {
    time: bar.t * 1000, // Convert to milliseconds
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: parseFloat(bar.volume),
  };
};

// Transform array of bar data for chart consumption
export const transformSpotCandlesForChart = (bars: SpotApiBarObject[]): TradingViewBar[] => {
  return bars.map(transformSpotCandleForChart);
};

const getSpotPriceDecimals = (price?: number | null): number => {
  if (!price || price <= 0) return 6;

  const magnitude = Math.floor(Math.log10(Math.abs(price)));
  const decimals = Math.max(0, SMALL_USD_DECIMALS - magnitude - 1);

  return Math.min(decimals, 10);
};

// Create symbol info for spot tokens
export const createSpotSymbolInfo = (
  tokenMint: string,
  tokenPrice?: number | null
): LibrarySymbolInfo => {
  const decimals = getSpotPriceDecimals(tokenPrice);
  const pricescale = 10 ** decimals;

  return {
    ticker: tokenMint,
    name: tokenMint,
    description: tokenMint,
    type: 'crypto',
    session: '24x7',
    timezone,
    exchange: 'Spot',
    listed_exchange: 'Spot',
    minmov: 1,
    pricescale,
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
