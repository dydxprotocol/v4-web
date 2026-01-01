import { useEffect, useRef } from 'react';
import type { Candle, CandleInterval } from 'fuel-ts-sdk/trading';
import type {
  ChartingLibraryFeatureset,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from 'public/tradingview/charting_library';
import * as styles from './TradingChart.css';
import { createDatafeed } from './TradingChart.utils';

export interface TradingChartProps {
  symbol: string;
  candlesGetter: (interval: CandleInterval) => Promise<Candle[]>;
}

export function TradingChart({ symbol, candlesGetter }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol,
      datafeed: createDatafeed(candlesGetter),
      interval: '15' as ResolutionString,
      container: containerRef.current,
      library_path: '/tradingview/',
      locale: 'en',
      disabled_features: [
        'use_localstorage_for_settings',
        'volume_force_overlay',
        'header_symbol_search',
        'header_compare',
        'header_undo_redo',
        'header_screenshot',
        'header_saveload',
        'left_toolbar',
        'control_bar',
        'edit_buttons_in_legend',
        'context_menus',
        'pane_context_menu',
        'scales_context_menu',
        'legend_context_menu',
        'main_series_scale_menu',
        'display_market_status',
        'show_object_tree',
        'create_volume_indicator_by_default',
        'header_widget',
        'trading_account_manager' as ChartingLibraryFeatureset,
      ],
      enabled_features: [],
      theme: 'Dark',
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#26a69a',
        'mainSeriesProperties.candleStyle.downColor': '#ef5350',
        'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
        'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
      },
    };

    const widget = new window.TradingView.widget(widgetOptions);

    widget.onChartReady(() => {
      widgetRef.current = widget;
    });

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [candlesGetter, symbol]);

  return <div ref={containerRef} css={styles.container} />;
}
