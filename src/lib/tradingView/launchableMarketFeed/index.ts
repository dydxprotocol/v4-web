/* eslint-disable @typescript-eslint/no-unused-vars */
import { DateTime } from 'luxon';
import type {
  DatafeedConfiguration,
  ErrorCallback,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
  Timezone,
} from 'public/tradingview/charting_library';

import { MetadataServiceCandlesResponse } from '@/constants/assetMetadata';
import { LAUNCHABLE_MARKETS_RESOLUTION_MAP } from '@/constants/candles';
import { DEFAULT_MARKETID } from '@/constants/markets';

import { type RootStore } from '@/state/_store';
import { setLaunchableMarketCandles } from '@/state/launchableMarkets';
import { getMetadataServiceBarsForPriceChart } from '@/state/launchableMarketsSelectors';

import metadataClient from '@/clients/metadataService';
import { getAssetFromMarketId } from '@/lib/assetUtils';
import { objectKeys } from '@/lib/objectHelpers';

import { log } from '../../telemetry';
import { getHistorySlice2, getSymbol, mapCandles2 } from '../utils';

const timezone = DateTime.local().get('zoneName') as unknown as Timezone;

const configurationData: DatafeedConfiguration = {
  supported_resolutions: objectKeys(LAUNCHABLE_MARKETS_RESOLUTION_MAP),
  supports_marks: true,
  exchanges: [
    {
      value: 'dYdX', // `exchange` argument for the `searchSymbols` method, if a user selects this exchange
      name: 'dYdX', // filter name
      desc: 'dYdX v4 exchange', // full exchange name displayed in the filter popup
    },
  ],
  symbols_types: [
    {
      name: 'crypto',
      value: 'crypto', // `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
    },
  ],
};

export const getLaunchableMarketDatafeed = (
  store: RootStore,
  tickSizeDecimals: number
): IBasicDataFeed => ({
  onReady: (callback: OnReadyCallback) => {
    setTimeout(() => callback(configurationData), 0);
  },

  searchSymbols: (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: SearchSymbolsCallback
  ) => {
    onResultReadyCallback([]);
  },

  resolveSymbol: async (symbolName: string, onSymbolResolvedCallback: ResolveCallback) => {
    const symbolItem = getSymbol(symbolName || DEFAULT_MARKETID);

    const pricescale = tickSizeDecimals ? 10 ** tickSizeDecimals : 100;

    const symbolInfo: LibrarySymbolInfo = {
      ticker: symbolItem.symbol,
      name: symbolItem.full_name,
      description: symbolItem.description,
      type: symbolItem.type,
      exchange: 'dYdX',
      listed_exchange: 'dYdX',
      has_intraday: false,
      has_daily: true,

      minmov: 1,
      pricescale,

      session: '24x7',
      intraday_multipliers: ['60', '240'],
      supported_resolutions: configurationData.supported_resolutions!,
      data_status: 'streaming',
      timezone,
      format: 'price',
    };

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  },

  getBars: async (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: {
      countBack: number;
      from: number;
      to: number;
      firstDataRequest: boolean;
    },
    onHistoryCallback: HistoryCallback,
    onErrorCallback: ErrorCallback
  ) => {
    if (!symbolInfo) return;
    console.log('GET BARSSSSSS');
    const asset = getAssetFromMarketId(symbolInfo.ticker!);

    const { from, to, firstDataRequest } = periodParams;
    const fromMs = from * 1000;
    let toMs = to * 1000;

    // Add 1ms to the toMs to ensure that today's candle is included
    if (firstDataRequest && resolution === '1D') {
      toMs += 1;
    }

    try {
      const currentMarketBars = getMetadataServiceBarsForPriceChart(
        store.getState(),
        symbolInfo.ticker!,
        resolution
      );

      // Retrieve candles in the store that are between fromMs and toMs
      const cachedBars = getHistorySlice2({
        bars: currentMarketBars,
        fromMs,
        toMs,
        firstDataRequest,
      });

      if (!cachedBars.length) {
        const candlesResponse = await metadataClient.getCandles({
          asset,
          resolution: LAUNCHABLE_MARKETS_RESOLUTION_MAP[resolution],
        });

        const fetchedCandles: MetadataServiceCandlesResponse[string] | undefined =
          candlesResponse?.[asset] ?? [];

        if (fetchedCandles) {
          store.dispatch(
            setLaunchableMarketCandles({
              candles: fetchedCandles,
              marketId: symbolInfo.ticker!,
              resolution,
            })
          );

          const bars = [...(fetchedCandles?.map(mapCandles2) ?? [])];

          console.log('1', bars);

          onHistoryCallback(bars, {
            noData: false,
          });
        }
      } else {
        if (cachedBars[cachedBars.length - 1].time < fromMs) {
          console.log('2', cachedBars[cachedBars.length - 1].time, fromMs);
          onHistoryCallback([], {
            noData: true,
          });
        } else {
          onHistoryCallback([], {
            noData: true,
          });
        }
      }
    } catch (error) {
      log('tradingView/launchableMarketFeed/getBars', error);
      onErrorCallback(error);
    }
  },

  subscribeBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback: Function
  ) => {
    // subscribeOnStream({
    //   symbolInfo,
    //   resolution,
    //   onRealtimeCallback: onTick,
    //   listenerGuid,
    //   onResetCacheNeededCallback,
    //   lastBar: lastBarsCache.get(
    //     `${symbolInfo.ticker}/${LAUNCHABLE_MARKETS_RESOLUTION_MAP[resolution]}`
    //   ),
    // });
  },

  unsubscribeBars: (subscriberUID: string) => {
    // unsubscribeFromStream(subscriberUID);
  },
});
