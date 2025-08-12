import { wrapAndLogBonsaiError } from '@/bonsai/logs';
import type { DatafeedConfiguration, IBasicDataFeed } from 'public/tradingview/charting_library';

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
    setTimeout(() => cb(configurationData), 0);
  },

  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
    // For now, return empty results
    onResultReadyCallback([]);
  },

  resolveSymbol: async (tokenSymbol, onSymbolResolvedCallback) => {
    const symbolInfo = createSpotSymbolInfo(tokenSymbol);
    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  },

  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    const { from, to } = periodParams;

    if (!symbolInfo.ticker) {
      const error = new Error('Symbol ticker is required');
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

      const bars = await wrapAndLogBonsaiError(
        () => getSpotCandleData(spotApiUrl, query),
        'getSpotCandleData'
      )();

      if (bars.length === 0) {
        onHistoryCallback([], { noData: true });
      } else {
        onHistoryCallback(bars, { noData: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onErrorCallback(errorMessage);
    }
  },

  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID) => {
    if (!symbolInfo.ticker) return;
    const token = symbolInfo.ticker;
    subscribeToSpotStream(spotApiUrl, token, resolution, onRealtimeCallback, subscriberUID);
  },

  unsubscribeBars: (subscriberUID) => {
    unsubscribeFromSpotStream(subscriberUID);
  },
});
