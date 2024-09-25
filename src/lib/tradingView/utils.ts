import { OrderSide } from '@dydxprotocol/v4-client-js';
import {
  ChartPropertiesOverrides,
  TradingTerminalWidgetOptions,
} from 'public/tradingview/charting_library';

import { MetadataServiceCandlesResponse } from '@/constants/assetMetadata';
import {
  Candle,
  TradingViewBar,
  TradingViewChartBar,
  TradingViewSymbol,
} from '@/constants/candles';
import { THEME_NAMES } from '@/constants/styles/colors';
import type { ChartLineType } from '@/constants/tvchart';

import { Themes } from '@/styles/themes';

import { AppTheme, type AppColorMode } from '@/state/configs';

import { getDisplayableTickerFromMarket } from '../assetUtils';
import { testFlags } from '../testFlags';

const MIN_NUM_TRADES_FOR_ORDERBOOK_PRICES = 10;

const getOhlcValues = ({
  orderbookCandlesToggleOn,
  trades,
  tradeOpen,
  tradeClose,
  tradeLow,
  tradeHigh,
  orderbookOpen,
  orderbookClose,
}: {
  orderbookCandlesToggleOn: boolean;
  trades: number;
  tradeOpen: number;
  tradeClose: number;
  tradeLow: number;
  tradeHigh: number;
  orderbookOpen?: number;
  orderbookClose?: number;
}) => {
  const useOrderbookCandles =
    orderbookCandlesToggleOn &&
    trades <= MIN_NUM_TRADES_FOR_ORDERBOOK_PRICES &&
    orderbookOpen !== undefined &&
    orderbookClose !== undefined;

  return {
    low: useOrderbookCandles ? Math.min(orderbookOpen, orderbookClose) : tradeLow,
    high: useOrderbookCandles ? Math.max(orderbookOpen, orderbookClose) : tradeHigh,
    open: useOrderbookCandles ? orderbookOpen : tradeOpen,
    close: useOrderbookCandles ? orderbookClose : tradeClose,
  };
};

export const mapCandles2 = (candle: MetadataServiceCandlesResponse[string][number]) => {
  return {
    time: new Date(candle.time).getTime(),
    open: candle.open,
    close: candle.close,
    high: candle.high,
    low: candle.low,
    volume: candle.volume,
  };
};

export const mapCandle =
  (orderbookCandlesToggleOn: boolean) =>
  ({
    startedAt,
    open,
    close,
    high,
    low,
    baseTokenVolume,
    trades,
    orderbookMidPriceOpen,
    orderbookMidPriceClose,
  }: Candle): TradingViewChartBar => {
    const tradeOpen = parseFloat(open);
    const tradeClose = parseFloat(close);
    const tradeLow = parseFloat(low);
    const tradeHigh = parseFloat(high);
    const orderbookOpen = orderbookMidPriceOpen ? parseFloat(orderbookMidPriceOpen) : undefined;
    const orderbookClose = orderbookMidPriceClose ? parseFloat(orderbookMidPriceClose) : undefined;

    return {
      ...getOhlcValues({
        orderbookCandlesToggleOn,
        trades,
        tradeOpen,
        tradeClose,
        tradeLow,
        tradeHigh,
        orderbookOpen,
        orderbookClose,
      }),
      time: new Date(startedAt).getTime(),
      volume: Math.ceil(Number(baseTokenVolume)),
      tradeOpen,
      tradeClose,
      orderbookOpen,
      orderbookClose,
      tradeLow,
      tradeHigh,
      trades,
    };
  };

const mapTradingViewChartBar = ({
  orderbookCandlesToggleOn,
  bar,
}: {
  orderbookCandlesToggleOn: boolean;
  bar: TradingViewChartBar;
}): TradingViewChartBar => {
  const { trades, orderbookOpen, orderbookClose, tradeOpen, tradeClose, tradeLow, tradeHigh } = bar;

  return {
    ...bar,
    ...getOhlcValues({
      orderbookCandlesToggleOn,
      trades,
      tradeOpen,
      tradeClose,
      tradeLow,
      tradeHigh,
      orderbookOpen,
      orderbookClose,
    }),
  };
};

export const getSymbol = (marketId: string): TradingViewSymbol => ({
  description: marketId,
  exchange: 'dYdX',
  full_name: getDisplayableTickerFromMarket(marketId),
  symbol: marketId,
  type: 'crypto',
});

export const getHistorySlice = ({
  bars,
  fromMs,
  toMs,
  firstDataRequest,
  orderbookCandlesToggleOn,
}: {
  bars?: TradingViewChartBar[];
  fromMs: number;
  toMs: number;
  firstDataRequest: boolean;
  orderbookCandlesToggleOn: boolean;
}): TradingViewChartBar[] => {
  if (!bars || (!firstDataRequest && bars.length > 0 && toMs < bars[0].time)) {
    return [];
  }

  return bars
    .map((bar) => mapTradingViewChartBar({ orderbookCandlesToggleOn, bar }))
    .filter(({ time }) => time >= fromMs);
};

export const getHistorySlice2 = ({
  bars,
  fromMs,
  toMs,
  firstDataRequest,
}: {
  bars?: TradingViewBar[];
  fromMs: number;
  toMs: number;
  firstDataRequest: boolean;
}): TradingViewBar[] => {
  if (!bars) {
    return [];
  }

  return bars.filter(({ time }) => time >= fromMs);
};

export const getChartLineColors = ({
  appTheme,
  appColorMode,
  chartLineType,
}: {
  appTheme: AppTheme;
  appColorMode: AppColorMode;
  chartLineType: ChartLineType;
}) => {
  const theme = Themes[appTheme][appColorMode];
  const orderColors = {
    [OrderSide.BUY]: theme.positive,
    [OrderSide.SELL]: theme.negative,
    entry: null,
    liquidation: theme.warning,
  };

  return {
    maybeQuantityColor: orderColors[chartLineType],
    borderColor: theme.borderDefault,
    backgroundColor: theme.layer1,
    textColor: theme.textTertiary,
    textButtonColor: theme.textButton,
  };
};

export const getWidgetOverrides = ({
  appTheme,
  appColorMode,
}: {
  appTheme: AppTheme;
  appColorMode: AppColorMode;
}) => {
  const theme = Themes[appTheme][appColorMode];

  return {
    theme: THEME_NAMES[appTheme],
    overrides: {
      'paneProperties.background': theme.layer2,
      'paneProperties.horzGridProperties.color': theme.layer3,
      'paneProperties.vertGridProperties.color': theme.layer3,
      'paneProperties.crossHairProperties.style': 1,
      'paneProperties.legendProperties.showBarChange': false,
      'paneProperties.backgroundType': 'solid' as const,

      'mainSeriesProperties.style': 1,
      'mainSeriesProperties.candleStyle.upColor': theme.positive,
      'mainSeriesProperties.candleStyle.borderUpColor': theme.positive,
      'mainSeriesProperties.candleStyle.wickUpColor': theme.positive,
      'mainSeriesProperties.candleStyle.downColor': theme.negative,
      'mainSeriesProperties.candleStyle.borderDownColor': theme.negative,
      'mainSeriesProperties.candleStyle.wickDownColor': theme.negative,
      'mainSeriesProperties.statusViewStyle.symbolTextSource': 'ticker',

      'scalesProperties.textColor': theme.textPrimary,
      'scalesProperties.backgroundColor': theme.layer2,
      'scalesProperties.lineColor': theme.layer3,
      'scalesProperties.fontSize': 12,
    } as Partial<ChartPropertiesOverrides>,
    studies_overrides: {
      'volume.volume.color.0': theme.negative,
      'volume.volume.color.1': theme.positive,
      'volume.volume ma.visible': false,
      'relative strength index.plot.color': theme.accent,
      'relative strength index.plot.linewidth': 1.5,
      'relative strength index.hlines background.color': '#134A9F',
    },
    loading_screen: {
      backgroundColor: theme.layer2,
      foregroundColor: theme.layer2,
    },
  };
};

export const getWidgetOptions = (): Partial<TradingTerminalWidgetOptions> &
  Pick<TradingTerminalWidgetOptions, 'container'> => {
  const { uiRefresh } = testFlags;

  return {
    debug: true,
    container: 'tv-price-chart',
    library_path: '/tradingview/', // relative to public folder
    custom_css_url: uiRefresh
      ? '/tradingview/custom-styles.css'
      : '/tradingview/custom-styles-deprecated.css',
    custom_font_family: "'Satoshi', system-ui, -apple-system, Helvetica, Arial, sans-serif",
    autosize: true,
    disabled_features: [
      'header_symbol_search',
      'header_compare',
      'symbol_search_hot_key',
      'symbol_info',
      'go_to_date',
      'timeframes_toolbar',
      'header_layouttoggle',
      'trading_account_manager',
    ],
    enabled_features: [
      'remove_library_container_border',
      'hide_last_na_study_output',
      'dont_show_boolean_study_arguments',
      'hide_left_toolbar_by_default',
      'hide_right_toolbar',
    ],
  };
};

export const getSavedResolution = ({ savedConfig }: { savedConfig?: object }): string | null => {
  // @ts-ignore
  const sources = (savedConfig?.charts ?? []).flatMap((chart: { panes: any[] }) =>
    chart.panes.flatMap((pane) => pane.sources)
  );

  const savedResolution = sources.find(
    (source: { type: string; state: { interval: string | null } }) => source.type === 'MainSeries'
  )?.state?.interval;

  return savedResolution ?? undefined;
};
