import Color from 'color';
import isEmpty from 'lodash/isEmpty';

import { Candle, TradingViewBar, TradingViewSymbol } from '@/constants/candles';
import { Colors } from '@/styles/colors';

import { AppTheme } from '@/state/configs';

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

export const getAllSymbols = (marketIds: string[]): TradingViewSymbol[] =>
  marketIds.map((marketId) => ({
    description: marketId,
    exchange: 'dYdX',
    full_name: marketId,
    symbol: marketId,
    type: 'crypto',
  }));

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

export const getWidgetOverrides = (theme: AppTheme) => {
  const colors = Colors[theme];

  return {
    overrides: {
      'paneProperties.background': Color(colors.layer2).hex(),
      'paneProperties.horzGridProperties.color': Color(colors.layer3).hex(),
      'paneProperties.vertGridProperties.color': Color(colors.layer3).hex(),
      'paneProperties.crossHairProperties.style': 1,
      'paneProperties.legendProperties.showBarChange': false,
      'paneProperties.backgroundType': 'solid',

      'mainSeriesProperties.style': 1,
      'mainSeriesProperties.candleStyle.upColor': Color(colors.positive).hex(),
      'mainSeriesProperties.candleStyle.borderUpColor': Color(colors.positive).hex(),
      'mainSeriesProperties.candleStyle.wickUpColor': Color(colors.positive).hex(),
      'mainSeriesProperties.candleStyle.downColor': Color(colors.negative).hex(),
      'mainSeriesProperties.candleStyle.borderDownColor': Color(colors.negative).hex(),
      'mainSeriesProperties.candleStyle.wickDownColor': Color(colors.negative).hex(),
      'mainSeriesProperties.statusViewStyle.symbolTextSource': 'ticker',

      'scalesProperties.textColor': Color(colors.text1).hex(),
      'scalesProperties.backgroundColor': Color(colors.layer2).hex(),
      'scalesProperties.lineColor': Color(colors.layer3).hex(),
    },
    studies_overrides: {
      'volume.volume.color.0': Color(colors.negative).hex(),
      'volume.volume.color.1': Color(colors.positive).hex(),
      'volume.volume ma.visible': false,
      'relative strength index.plot.color': Color(colors.accent).hex(),
      'relative strength index.plot.linewidth': 1.5,
      'relative strength index.hlines background.color': '#134A9F',
    },
    loading_screen: {
      backgroundColor: Color(colors.layer2).hex(),
      foregroundColor: Color(colors.layer2).hex(),
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
