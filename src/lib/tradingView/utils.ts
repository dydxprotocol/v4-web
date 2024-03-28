import { OrderSide } from '@dydxprotocol/v4-client-js';

import { Candle, TradingViewBar, TradingViewSymbol } from '@/constants/candles';
import { THEME_NAMES } from '@/constants/styles/colors';
import type { ChartLineType } from '@/constants/tvchart';

import { Themes } from '@/styles/themes';

import { type AppColorMode, AppTheme } from '@/state/configs';

export const mapCandle = ({
  startedAt,
  open,
  close,
  high,
  low,
  baseTokenVolume,
}: Candle): TradingViewBar => ({
  time: new Date(startedAt).getTime(),
  low: parseFloat(low),
  high: parseFloat(high),
  open: parseFloat(open),
  close: parseFloat(close),
  volume: Math.ceil(Number(baseTokenVolume)),
});

export const getSymbol = (marketId: string): TradingViewSymbol => ({
  description: marketId,
  exchange: 'dYdX',
  full_name: marketId,
  symbol: marketId,
  type: 'crypto',
});

export const getHistorySlice = ({
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
  if (!bars || (!firstDataRequest && bars.length > 0 && toMs < bars[0].time)) {
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
    ['entry']: null,
    ['liquidation']: theme.warning,
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
      'paneProperties.backgroundType': 'solid',

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
    },
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

export const getWidgetOptions = () => {
  return {
    // debug: true,
    container: 'tv-price-chart',
    library_path: '/tradingview/', // relative to public folder
    custom_css_url: '/tradingview/custom-styles.css',
    autosize: true,
    disabled_features: [
      'header_symbol_search',
      'header_compare',
      'symbol_search_hot_key',
      'compare_symbol',
      'symbol_info',
      'go_to_date',
      'timeframes_toolbar',
    ],
    enabled_features: [
      'remove_library_container_border',
      'hide_last_na_study_output',
      'dont_show_boolean_study_arguments',
      'hide_left_toolbar_by_default',
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

  return savedResolution ?? null;
};
