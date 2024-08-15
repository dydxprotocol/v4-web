import { groupBy } from 'lodash';
import { DateTime } from 'luxon';
import type {
  DatafeedConfiguration,
  ErrorCallback,
  GetMarksCallback,
  HistoryCallback,
  LibrarySymbolInfo,
  Mark,
  OnReadyCallback,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  Timezone,
} from 'public/tradingview/charting_library';

import { Candle, RESOLUTION_MAP } from '@/constants/candles';
import { StringGetterFunction, SupportedLocales } from '@/constants/localization';
import { DEFAULT_MARKETID } from '@/constants/markets';

import { useDydxClient } from '@/hooks/useDydxClient';

import { type RootStore } from '@/state/_store';
import { getMarketFills } from '@/state/accountSelectors';
import { setCandles } from '@/state/perpetuals';
import {
  getMarketConfig,
  getMarketData,
  getPerpetualBarsForPriceChart,
} from '@/state/perpetualsSelectors';

import { objectKeys } from '@/lib/objectHelpers';

import { log } from '../../telemetry';
import { getHistorySlice, getSymbol, mapCandle } from '../utils';
import { lastBarsCache } from './cache';
import { subscribeOnStream, unsubscribeFromStream } from './streaming';
import { getMarkForOrderFills } from './utils';

const timezone = DateTime.local().get('zoneName') as unknown as Timezone;

const configurationData: DatafeedConfiguration = {
  supported_resolutions: objectKeys(RESOLUTION_MAP),
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

export const getDydxDatafeed = (
  store: RootStore,
  getCandlesForDatafeed: ReturnType<typeof useDydxClient>['getCandlesForDatafeed'],
  initialPriceScale: number | null,
  orderbookCandlesToggleOn: boolean,
  localeSeparators: {
    group?: string;
    decimal?: string;
  },
  selectedLocale: SupportedLocales,
  stringGetter: StringGetterFunction
) => ({
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
    const { tickSizeDecimals } = getMarketConfig(store.getState(), symbolItem.symbol) ?? {};

    const pricescale = tickSizeDecimals ? 10 ** tickSizeDecimals : initialPriceScale ?? 100;

    const symbolInfo: LibrarySymbolInfo = {
      ticker: symbolItem.full_name,
      name: symbolItem.symbol,
      description: symbolItem.description,
      type: symbolItem.type,
      full_name: symbolItem.full_name,
      exchange: 'dYdX',
      listed_exchange: 'dYdX',
      has_intraday: true,
      has_daily: true,

      minmov: 1,
      pricescale,

      session: '24x7',
      intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
      supported_resolutions: configurationData.supported_resolutions!,
      data_status: 'streaming',
      timezone,
      format: 'price',
    };

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  },

  getMarks: async (
    symbolInfo: LibrarySymbolInfo,
    from: number,
    to: number,
    onDataCallback: GetMarksCallback<Mark>,
    resolution: ResolutionString
  ) => {
    const [fromMs, toMs] = [from * 1000, to * 1000];
    const market = getMarketData(store.getState(), symbolInfo.name);
    if (!market) return;

    const fills = getMarketFills(store.getState())[symbolInfo.name] ?? [];
    const inRangeFills = fills.filter(
      (fill) => fill.createdAtMilliseconds >= fromMs && fill.createdAtMilliseconds <= toMs
    );
    const fillsByOrderId = groupBy(inRangeFills, 'orderId');
    const marks = Object.entries(fillsByOrderId).map(([orderId, orderFills]) =>
      getMarkForOrderFills(
        store,
        orderFills,
        orderId,
        fromMs,
        resolution,
        stringGetter,
        localeSeparators,
        selectedLocale
      )
    );
    onDataCallback(marks);
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

    const { countBack, from, to, firstDataRequest } = periodParams;
    const fromMs = from * 1000;
    let toMs = to * 1000;

    // Add 1ms to the toMs to ensure that today's candle is included
    if (firstDataRequest && resolution === '1D') {
      toMs += 1;
    }

    try {
      const currentMarketBars = getPerpetualBarsForPriceChart(orderbookCandlesToggleOn)(
        store.getState(),
        symbolInfo.name,
        resolution
      );

      // Retrieve candles in the store that are between fromMs and toMs
      const cachedBars = getHistorySlice({
        bars: currentMarketBars,
        fromMs,
        toMs,
        firstDataRequest,
        orderbookCandlesToggleOn,
      });

      let fetchedCandles: Candle[] | undefined;

      // If there are not enough candles in the store, retrieve more from the API
      if (cachedBars.length < countBack) {
        const earliestCachedBarTime = cachedBars?.[cachedBars.length - 1]?.time;

        fetchedCandles = await getCandlesForDatafeed({
          marketId: symbolInfo.name,
          resolution,
          fromMs,
          toMs: earliestCachedBarTime || toMs,
        });

        store.dispatch(
          setCandles({ candles: fetchedCandles, marketId: symbolInfo.full_name, resolution })
        );
      }

      const bars = [
        ...cachedBars,
        ...(fetchedCandles?.map(mapCandle(orderbookCandlesToggleOn)) ?? []),
      ].reverse();

      if (bars.length === 0) {
        onHistoryCallback([], {
          noData: true,
        });

        return;
      }

      if (firstDataRequest) {
        lastBarsCache.set(`${symbolInfo.full_name}/${RESOLUTION_MAP[resolution]}`, {
          ...bars[bars.length - 1],
        });
      }

      onHistoryCallback(bars, {
        noData: false,
      });
    } catch (error) {
      log('tradingView/dydxfeed/getBars', error);
      onErrorCallback(error);
    }
  },

  subscribeBars: (
    symbolInfo: any,
    resolution: any,
    onRealtimeCallback: any,
    subscribeUID: any,
    onResetCacheNeededCallback: any
  ) => {
    subscribeOnStream({
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscribeUID,
      onResetCacheNeededCallback,
      lastBar: lastBarsCache.get(`${symbolInfo.full_name}/${RESOLUTION_MAP[resolution]}`),
    });
  },

  unsubscribeBars: (subscriberUID: any) => {
    unsubscribeFromStream(subscriberUID);
  },
});
