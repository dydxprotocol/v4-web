import { DateTime } from 'luxon';
import type {
  DatafeedConfiguration,
  ErrorCallback,
  GetMarksCallback,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  Mark,
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
    _userInput: string,
    _exchange: string,
    _symbolType: string,
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
      has_intraday: true,
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

  getMarks: async (
    symbolInfo: LibrarySymbolInfo,
    fromSeconds: number,
    toSeconds: number,
    onDataCallback: GetMarksCallback<Mark>,
    _resolution: ResolutionString
  ) => {
    onDataCallback([]);
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

    const asset = getAssetFromMarketId(symbolInfo.ticker!);
    const { from } = periodParams;
    const fromMs = from * 1000;

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

          onHistoryCallback(bars, {
            noData: false,
          });
        }
      } else {
        if (cachedBars[cachedBars.length - 1].time < fromMs) {
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
    _symbolInfo: LibrarySymbolInfo,
    _resolution: ResolutionString,
    _onTick: SubscribeBarsCallback,
    _listenerGuid: string,
    _onResetCacheNeededCallback: Function
  ) => {},

  unsubscribeBars: (_subscriberUID: string) => {},
});
