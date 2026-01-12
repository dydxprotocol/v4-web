import { useEffect, useRef } from 'react';
import type { Candle, CandleInterval } from 'fuel-ts-sdk/trading';
import type {
  ChartingLibraryFeatureset,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from 'public/tradingview/charting_library';
import { colors } from '@/styles/colors';
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

    const lavaOverrides: ChartingLibraryWidgetOptions['overrides'] = {
      // Canvas / pane background
      'paneProperties.backgroundType': 'solid',
      'paneProperties.background': colors.darkVoid,
      'paneProperties.backgroundGradientStartColor': colors.darkVoid,
      'paneProperties.backgroundGradientEndColor': colors.darkVoid,
      // Make grid lines visible (higher contrast on darkVoid)
      'paneProperties.vertGridProperties.color': colors.whiteAlpha[8],
      'paneProperties.horzGridProperties.color': colors.whiteAlpha[8],
      'paneProperties.vertGridProperties.style': 0,
      'paneProperties.horzGridProperties.style': 0,
      // Pane separators (between main pane and volume/indicators)
      'paneProperties.separatorColor': colors.darkVoidAlpha[20],

      // Scale highlight defaults are blue; align them with the design system.
      'scalesProperties.axisHighlightColor': colors.liquidLavaAlpha[15],
      'scalesProperties.axisLineToolLabelBackgroundColorCommon': colors.liquidLava,
      'scalesProperties.axisLineToolLabelBackgroundColorActive': colors.liquidLava,
    };

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol,
      datafeed: createDatafeed(candlesGetter),
      interval: '15' as ResolutionString,
      container: containerRef.current,
      library_path: '/tradingview/',
      locale: 'en',
      // Global TradingView theming (toolbars, side panels, dialogs, etc.)
      // This is loaded by TradingView (typically inside its chart iframe), and is the most reliable way
      // to eliminate default blue accents.
      custom_css_url: '/tradingview/custom-styles.css',
      loading_screen: {
        backgroundColor: colors.darkVoid,
        foregroundColor: colors.liquidLava,
      },
      // Prevent chart properties from being pulled from localStorage and overriding our theme/overrides.
      disabled_features: [
        'trading_account_manager' as ChartingLibraryFeatureset,
        'use_localstorage_for_settings' as ChartingLibraryFeatureset,
      ],
      enabled_features: [],
      load_last_chart: false,
      theme: 'Dark',
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
      overrides: {
        ...lavaOverrides,
      },
    };

    const widget = new window.TradingView.widget(widgetOptions);

    widget.onChartReady(() => {
      // Force-apply overrides after the chart is initialized (helps when defaults/local settings win on first paint).
      widget.applyOverrides(lavaOverrides);
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
