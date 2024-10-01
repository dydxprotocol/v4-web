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
import { RESOLUTION_TO_TIMEFRAME_MAP, TradingViewBar } from '@/constants/candles';
import { DEFAULT_MARKETID } from '@/constants/markets';

import { type RootStore } from '@/state/_store';

import metadataClient from '@/clients/metadataService';
import { getAssetFromMarketId } from '@/lib/assetUtils';
import { objectKeys } from '@/lib/objectHelpers';

import { log } from '../../telemetry';
import { getSymbol, mapMetadataServiceCandles } from '../utils';

const timezone = DateTime.local().get('zoneName') as unknown as Timezone;

const launchableMarketCandlesCache = new Map<string, TradingViewBar[]>();

const configurationData: DatafeedConfiguration = {
  supported_resolutions: objectKeys(RESOLUTION_TO_TIMEFRAME_MAP),
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
    const { from, firstDataRequest } = periodParams;
    const fromMs = from * 1000;
    const cacheKey = `${symbolInfo.ticker!}-${resolution}`;

    try {
      const currentMarketBars = launchableMarketCandlesCache.get(cacheKey) ?? [];
      const cachedBars = [...currentMarketBars].filter((bar) => bar.time >= fromMs);

      if (firstDataRequest) {
        let bars: TradingViewBar[] = [];

        if (!cachedBars.length) {
          const candlesResponse = await metadataClient.getCandles({
            asset,
            timeframe: RESOLUTION_TO_TIMEFRAME_MAP[resolution],
          });

          const fetchedCandles: MetadataServiceCandlesResponse[string] | undefined =
            candlesResponse?.[asset] ?? [];

          if (fetchedCandles) {
            bars = [...(fetchedCandles?.map(mapMetadataServiceCandles) ?? [])];
            launchableMarketCandlesCache.set(cacheKey, bars);
          }
        } else {
          bars = cachedBars;
        }

        onHistoryCallback(bars, {
          noData: false,
        });
      } else {
        onHistoryCallback([], {
          noData: true,
        });
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
