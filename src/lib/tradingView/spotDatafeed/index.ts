import type { DatafeedConfiguration, IBasicDataFeed } from 'public/tradingview/charting_library';

import { log } from '@/lib/telemetry';

import { getSpotCandleData } from './candleService';
import { subscribeToSpotStream, unsubscribeFromSpotStream } from './streaming';
import { SpotCandleServiceQuery } from './types';
import {
  createSpotSymbolInfo,
  resolutionToSpotInterval,
  SPOT_SUPPORTED_RESOLUTIONS,
} from './utils';

const configurationData: DatafeedConfiguration = {
  supported_resolutions: SPOT_SUPPORTED_RESOLUTIONS,
  supports_marks: false, // Spot charts don't need order marks
  exchanges: [
    {
      value: 'Spot',
      name: 'Spot',
      desc: 'Spot',
    },
  ],
  symbols_types: [
    {
      name: 'crypto',
      value: 'crypto',
    },
  ],
};

export const getSpotDatafeed = (spotApiUrl: string): IBasicDataFeed => ({
  onReady: (cb) => {
    log('spotDatafeed/onReady');
    setTimeout(() => cb(configurationData), 0);
  },

  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
    // For now, return empty results
    onResultReadyCallback([]);
  },

  resolveSymbol: async (tokenSymbol, onSymbolResolvedCallback) => {
    const symbolInfo = createSpotSymbolInfo(tokenSymbol);

    log('spotDatafeed/resolveSymbol', undefined, {
      symbolName: tokenSymbol,
      ticker: symbolInfo.ticker,
    });

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  },

  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    const { from, to, firstDataRequest } = periodParams;

    log('spotDatafeed/getBars', undefined, {
      symbol: symbolInfo.ticker,
      resolution,
      from: new Date(from * 1000).toISOString(),
      to: new Date(to * 1000).toISOString(),
      firstDataRequest,
    });

    if (!symbolInfo.ticker) {
      const error = new Error('Symbol ticker is required');
      log('spotDatafeed/getBars/error', error);
      onErrorCallback(error.message);
      return;
    }

    try {
      const token = symbolInfo.ticker;
      const interval = resolutionToSpotInterval(resolution);
      const fromMs = from * 1000;
      const toMs = to * 1000;

      const query: SpotCandleServiceQuery = {
        token,
        interval,
        from: fromMs,
        to: toMs,
      };

      const bars = await getSpotCandleData(spotApiUrl, query);

      log('spotDatafeed/getBars/success', undefined, {
        symbol: token,
        resolution,
        barCount: bars.length,
      });

      if (bars.length === 0) {
        onHistoryCallback([], { noData: true });
      } else {
        onHistoryCallback(bars, { noData: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      log('spotDatafeed/getBars/error', error instanceof Error ? error : new Error(errorMessage));
      onErrorCallback(errorMessage);
    }
  },

  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID) => {
    log('spotDatafeed/subscribeBars', undefined, {
      symbol: symbolInfo.ticker,
      resolution,
      subscriberUID,
    });

    if (!symbolInfo.ticker) {
      log(
        'spotDatafeed/subscribeBars/error',
        new Error('Symbol ticker is required for subscription')
      );
      return;
    }

    const token = symbolInfo.ticker;

    subscribeToSpotStream(spotApiUrl, token, resolution, onRealtimeCallback, subscriberUID);
  },

  unsubscribeBars: (subscriberUID) => {
    log('spotDatafeed/unsubscribeBars', undefined, { subscriberUID });
    unsubscribeFromSpotStream(subscriberUID);
  },
});
