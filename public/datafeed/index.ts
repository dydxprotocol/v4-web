import { makeApiRequest, generateSymbol, parseFullSymbol } from './helper';
import { subscribeOnStream, unsubscribeFromStream } from './streaming';

const lastBarsCache = new Map();

const configurationData = {
  supported_resolutions: ['1D', '1W', '1M'],
  exchanges: [
    {
      value: 'Bitfinex',
      name: 'Bitfinex',
      desc: 'Bitfinex',
    },
    {
      // `exchange` argument for the `searchSymbols` method, if a user selects this exchange
      value: 'Kraken',

      // filter name
      name: 'Kraken',

      // full exchange name displayed in the filter popup
      desc: 'Kraken bitcoin exchange',
    },
  ],
  symbols_types: [
    {
      name: 'crypto',

      // `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
      value: 'crypto',
    },
    // ...
  ],
};

async function getAllSymbols(): Promise<any> {
  const data = await makeApiRequest('data/v3/all/exchanges');
  let allSymbols: any = [];

  for (const exchange of configurationData.exchanges) {
    const pairs = data.Data[exchange.value].pairs;

    for (const leftPairPart of Object.keys(pairs)) {
      const symbols = pairs[leftPairPart].map((rightPairPart: any) => {
        const symbol = generateSymbol(exchange.value, leftPairPart, rightPairPart);
        return {
          symbol: symbol.short,
          full_name: symbol.full,
          description: symbol.short,
          exchange: exchange.value,
          type: 'crypto',
        };
      });
      allSymbols = [...allSymbols, ...symbols];
    }
  }
  return allSymbols;
}

export default {
  onReady: (callback: any) => {
    setTimeout(() => callback(configurationData));
  },

  searchSymbols: async (userInput: any, exchange: string, _: any, onResultReadyCallback: any) => {
    const symbols = await getAllSymbols();
    const newSymbols = symbols.filter((symbol: any) => {
      const isExchangeValid = exchange === '' || symbol.exchange === exchange;
      const isFullSymbolContainsInput =
        symbol.full_name.toLowerCase().indexOf(userInput.toLowerCase()) !== -1;
      return isExchangeValid && isFullSymbolContainsInput;
    });
    onResultReadyCallback(newSymbols);
  },

  resolveSymbol: async (
    symbolName: string,
    onSymbolResolvedCallback: any,
    onResolveErrorCallback: any
  ) => {
    const symbols = await getAllSymbols();
    const symbolItem = symbols.find(({ full_name }: any) => full_name === symbolName);
    if (!symbolItem) {
      onResolveErrorCallback('cannot resolve symbol');
      return;
    }
    const symbolInfo = {
      ticker: symbolItem.full_name,
      name: symbolItem.symbol,
      description: symbolItem.description,
      type: symbolItem.type,
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: symbolItem.exchange,
      minmov: 1,
      pricescale: 100,
      has_intraday: false,
      has_no_volume: true,
      has_weekly_and_monthly: false,
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming',
    };

    onSymbolResolvedCallback(symbolInfo);
  },

  getBars: async (
    symbolInfo: any,
    resolution: any,
    periodParams: any,
    onHistoryCallback: any,
    onErrorCallback: any
  ) => {
    const { from, to, firstDataRequest } = periodParams;
    const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
    if (!parsedSymbol) return;

    const urlParameters: any = {
      e: parsedSymbol.exchange,
      fsym: parsedSymbol.fromSymbol,
      tsym: parsedSymbol.toSymbol,
      toTs: to,
      limit: 2000,
    };

    const query = Object.keys(urlParameters)
      .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
      .join('&');
    try {
      const data = await makeApiRequest(`data/histoday?${query}`);

      if ((data.Response && data.Response === 'Error') || data.Data.length === 0) {
        // "noData" should be set if there is no data in the requested period.
        onHistoryCallback([], {
          noData: true,
        });
        return;
      }

      let bars: any = [];

      data.Data.forEach((bar: any) => {
        if (bar.time >= from && bar.time < to) {
          bars = [
            ...bars,
            {
              time: bar.time * 1000,
              low: bar.low,
              high: bar.high,
              open: bar.open,
              close: bar.close,
            },
          ];
        }
      });

      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.full_name, {
          ...bars[bars.length - 1],
        });
      }

      onHistoryCallback(bars, {
        noData: false,
      });
    } catch (error) {
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
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscribeUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.full_name)
    );
  },

  unsubscribeBars: (subscriberUID: any) => {
    unsubscribeFromStream(subscriberUID);
  },
};
