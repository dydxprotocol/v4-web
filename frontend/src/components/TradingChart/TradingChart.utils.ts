import type { Candle, CandleInterval } from 'fuel-ts-sdk/trading';
import type {
  Bar,
  ErrorCallback,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  ResolutionString,
  ResolveCallback,
  SubscribeBarsCallback,
  PeriodParams,
} from 'public/tradingview/charting_library';

// Map TradingView resolutions to our candle intervals

export function createDatafeed(
  getCandles: (interval: CandleInterval) => Promise<Candle[]>
): IBasicDataFeed {
  return {
    onReady: (callback: OnReadyCallback) => {
      setTimeout(() => {
        callback({
          supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'] as ResolutionString[],
          supports_marks: false,
          supports_timescale_marks: false,
          supports_time: true,
        });
      }, 0);
    },

    searchSymbols: () => {
      // Not implemented - we don't have symbol search
    },

    resolveSymbol: (symbolName: string, onResolve: ResolveCallback) => {
      setTimeout(() => {
        const symbolInfo: LibrarySymbolInfo = {
          name: symbolName,
          ticker: symbolName,
          description: symbolName,
          type: 'crypto',
          session: '24x7',
          timezone: 'Etc/UTC',
          exchange: 'Starboard',
          listed_exchange: 'Starboard',
          minmov: 1,
          pricescale: 100000000, // 8 decimals
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: false,
          supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'] as ResolutionString[],
          volume_precision: 8,
          data_status: 'streaming',
          format: 'price',
        };
        onResolve(symbolInfo);
      }, 0);
    },

    getBars: async (
      _symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: PeriodParams,
      onResult: HistoryCallback,
      onError: ErrorCallback
    ) => {
      try {
        const interval = convertResolution(resolution);
        const candles = await getCandles(interval);

        // Convert candles to TradingView bars
        const bars: Bar[] = candles
          .filter((candle: Candle) => {
            const time = candle.startedAt * 1000;
            return time >= periodParams.from * 1000 && time < periodParams.to * 1000;
          })
          .map(
            (candle: Candle): Bar => ({
              time: candle.startedAt * 1000,
              open: Number(candle.openPrice) / 100000000,
              high: Number(candle.highPrice) / 100000000,
              low: Number(candle.lowPrice) / 100000000,
              close: Number(candle.closePrice) / 100000000,
            })
          )
          .sort((a: Bar, b: Bar) => a.time - b.time);

        onResult(bars, { noData: bars.length === 0 });
      } catch (error) {
        console.error('Error fetching bars:', error);
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    },

    subscribeBars: (
      _symbolInfo: LibrarySymbolInfo,
      _resolution: ResolutionString,
      _onTick: SubscribeBarsCallback,
      _listenerGuid: string,
      _onResetCacheNeededCallback: () => void
    ) => {
      // Real-time updates would go here
      // You can subscribe to Redux store changes and call onTick with new bars
    },

    unsubscribeBars: (_listenerGuid: string) => {},
  };
}

function convertResolution(resolution: ResolutionString): CandleInterval {
  return resolutionMap[resolution] || 'M15';
}

const resolutionMap: Record<string, CandleInterval> = {
  '1': 'M1',
  '5': 'M5',
  '15': 'M15',
  '30': 'M30',
  '60': 'H1',
  '240': 'H4',
  '1D': 'D1',
};
