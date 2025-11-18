import { wrapAndLogBonsaiError } from '@/bonsai/logs';
import type { DatafeedConfiguration, IBasicDataFeed } from 'public/tradingview/charting_library';

import { getSpotBars, SpotApiGetBarsQuery } from '@/clients/spotApi';
import {
  subscribeToSpotCandles,
  unsubscribeFromSpotStream,
} from '@/lib/streaming/spotCandleStreaming';

import {
  createSpotSymbolInfo,
  resolutionToSpotInterval,
  SPOT_SUPPORTED_RESOLUTIONS,
  transformSpotCandleForChart,
  transformSpotCandlesForChart,
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
      const tokenMint = symbolInfo.ticker;
      const interval = resolutionToSpotInterval(resolution);

      const query: SpotApiGetBarsQuery = {
        tokenMint,
        resolution: interval,
        from,
        to,
      };

      const bars = await wrapAndLogBonsaiError(
        () => getSpotBars(spotApiUrl, query),
        'getSpotBars'
      )();

      if (bars.length === 0) {
        onHistoryCallback([], { noData: true });
      } else {
        const chartBars = transformSpotCandlesForChart(bars);
        onHistoryCallback(chartBars, { noData: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onErrorCallback(errorMessage);
    }
  },

  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID) => {
    if (!symbolInfo.ticker) return;

    const tokenMint = symbolInfo.ticker;
    const interval = resolutionToSpotInterval(resolution);

    subscribeToSpotCandles(
      spotApiUrl,
      tokenMint,
      interval,
      (bar) => {
        const chartBar = transformSpotCandleForChart(bar);
        onRealtimeCallback(chartBar);
      },
      subscriberUID
    );
  },

  unsubscribeBars: (subscriberUID) => {
    unsubscribeFromSpotStream(subscriberUID);
  },
});
