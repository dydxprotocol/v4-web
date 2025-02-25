import { BonsaiHelpers } from '@/bonsai/ontology';
// eslint-disable-next-line no-restricted-imports
import { subscribeOnStream, unsubscribeFromStream } from '@/bonsai/websocket/candlesForTradingView';
import { groupBy } from 'lodash';
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

import { Candle, RESOLUTION_MAP } from '@/constants/candles';
import { StringGetterFunction, SupportedLocales } from '@/constants/localization';
import { DEFAULT_MARKETID } from '@/constants/markets';

import { useDydxClient } from '@/hooks/useDydxClient';

import { Themes } from '@/styles/themes';

import { type RootStore } from '@/state/_store';
import { getMarketFills } from '@/state/accountSelectors';
import { getAppColorMode, getAppTheme } from '@/state/appUiConfigsSelectors';

import { objectKeys } from '@/lib/objectHelpers';
import { orEmptyObj } from '@/lib/typeUtils';

import { log } from '../../telemetry';
import { getSymbol, mapCandle } from '../utils';
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
  localeSeparators: {
    group?: string;
    decimal?: string;
  },
  selectedLocale: SupportedLocales,
  stringGetter: StringGetterFunction
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
    const { tickSizeDecimals } = orEmptyObj(
      BonsaiHelpers.markets.createSelectMarketSummaryById()(store.getState(), symbolItem.symbol)
    );

    const pricescale = tickSizeDecimals ? 10 ** tickSizeDecimals : initialPriceScale ?? 100;

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
    fromSeconds: number,
    toSeconds: number,
    onDataCallback: GetMarksCallback<Mark>,
    resolution: ResolutionString
  ) => {
    const theme = getAppTheme(store.getState());
    const colorMode = getAppColorMode(store.getState());

    const [fromMs, toMs] = [fromSeconds * 1000, toSeconds * 1000];
    const market = BonsaiHelpers.markets.createSelectMarketSummaryById()(
      store.getState(),
      symbolInfo.ticker!
    );
    if (!market) return;

    const fills = getMarketFills(store.getState())[symbolInfo.ticker!] ?? [];
    const inRangeFills = fills.filter(
      (fill) =>
        new Date(fill.createdAt ?? 0).getTime() >= fromMs &&
        new Date(fill.createdAt ?? 0).getTime() <= toMs
    );
    const fillsByOrderId = groupBy(inRangeFills, 'orderId');
    const marks = Object.entries(fillsByOrderId).map(([orderId, orderFills]) =>
      getMarkForOrderFills(
        store,
        orderFills,
        market.stepSizeDecimals,
        orderId,
        fromMs,
        resolution,
        stringGetter,
        localeSeparators,
        selectedLocale,
        Themes[theme][colorMode]
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!symbolInfo) return;

    // TODO: technically we should be prioritizing countBack over the from+to since it really wants at least that many bars
    const { from, to } = periodParams;
    const fromMs = from * 1000;
    // add one to make sure we get current day for 1d view
    const toMs = to * 1000 + 1;

    try {
      const fetchedCandles: Candle[] | undefined = await getCandlesForDatafeed({
        marketId: symbolInfo.ticker!,
        resolution,
        fromMs,
        toMs,
      });

      const bars = fetchedCandles.map(mapCandle).reverse();

      if (bars.length === 0) {
        onHistoryCallback([], {
          noData: true,
        });
      } else {
        onHistoryCallback(bars, {
          noData: false,
        });
      }
    } catch (error) {
      log('tradingView/dydxfeed/getBars', error);
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
    subscribeOnStream({
      store,
      symbolInfo,
      resolution,
      onRealtimeCallback: onTick,
      listenerGuid,
      onResetCacheNeededCallback,
    });
  },

  unsubscribeBars: (subscriberUID: string) => {
    unsubscribeFromStream(subscriberUID);
  },
});
