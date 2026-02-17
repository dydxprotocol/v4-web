import { wrapAndLogBonsaiError } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import type { DatafeedConfiguration, IBasicDataFeed } from 'public/tradingview/charting_library';

import { type RootStore } from '@/state/_store';

import {
  getSpotBars,
  SpotApiGetBarsQuery,
  SpotApiHistoricalBarsStatus,
  SpotApiTokenPairStatisticsType,
  transformBarsResponseToBars,
} from '@/clients/spotApi';
import { waitForSelector } from '@/lib/asyncUtils';
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

export const getSpotDatafeed = (store: RootStore, spotApiUrl: string): IBasicDataFeed => ({
  onReady: (cb) => {
    setTimeout(() => cb(configurationData), 0);
  },

  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
    // For now, return empty results
    onResultReadyCallback([]);
  },

  resolveSymbol: async (tokenMint, onSymbolResolvedCallback) => {
    setTimeout(async () => {
      const tokenPrice = await waitForSelector(store, (s) => BonsaiCore.spot.tokenPrice.data(s));
      const { symbol, tokenNameFull } = await waitForSelector(store, (s) =>
        BonsaiCore.spot.tokenMetadata.data(s)
      );
      const symbolInfo = createSpotSymbolInfo(tokenMint, tokenPrice, tokenNameFull, symbol);
      onSymbolResolvedCallback(symbolInfo);
    }, 0);
  },

  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    const { from, to, countBack } = periodParams;

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
        countback: Math.min(countBack, 1500),
        removeEmptyBars: true,
        statsType: SpotApiTokenPairStatisticsType.Filtered,
      };

      const barsResponse = await wrapAndLogBonsaiError(
        () => getSpotBars(spotApiUrl, query),
        'spot/getSpotBars'
      )();

      const bars = transformBarsResponseToBars(barsResponse);

      if (barsResponse.data.s === SpotApiHistoricalBarsStatus.NO_DATA) {
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
