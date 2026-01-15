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

function createTradingViewCustomCssUrl(): string {
  // Keep the existing TradingView theme file intact, but layer our Starboard overrides after it.
  // This avoids editing any CSS files and avoids runtime DOM injection into the iframe.
  const css = `
@import url("/tradingview/custom-styles.css");

/* Starboard: match dashboard panel grey for the Object Tree panel container. */
.wrap-ukH4sVzT,
.wrap-ukH4sVzT .space-ukH4sVzT,
.wrap-ukH4sVzT .tree-ukH4sVzT {
  background-color: ${colors.gluonGrey} !important;
}

/* Starboard: remove blue selection highlight in the Object Tree list. */
.wrap-IEe5qpW4,
html.theme-dark .wrap-IEe5qpW4 {
  background-color: ${colors.gluonGrey} !important;
}

@media (any-hover:hover) {
  .wrap-IEe5qpW4:hover,
  html.theme-dark .wrap-IEe5qpW4:hover {
    background-color: ${colors.slateGrey} !important;
  }
}

.wrap-IEe5qpW4.selected-IEe5qpW4,
html.theme-dark .wrap-IEe5qpW4.selected-IEe5qpW4,
.wrap-IEe5qpW4.childOfSelected-IEe5qpW4,
html.theme-dark .wrap-IEe5qpW4.childOfSelected-IEe5qpW4 {
  background-color: ${colors.slateGrey} !important;
}

@media (any-hover:hover) {
  .wrap-IEe5qpW4.selected-IEe5qpW4:hover,
  html.theme-dark .wrap-IEe5qpW4.selected-IEe5qpW4:hover,
  .wrap-IEe5qpW4.childOfSelected-IEe5qpW4:hover,
  html.theme-dark .wrap-IEe5qpW4.childOfSelected-IEe5qpW4:hover {
    background-color: ${colors.slateGrey} !important;
  }
}

/* Starboard: use Liquid Lava as TradingView active accent (fixes blue active widgetbar icon). */
:root, html, body {
  --color-accent: ${colors.liquidLava} !important;

  /* Starboard: remove the subtle bluish frame/padding around the chart (use gluonGrey). */
  --tv-color-platform-background: ${colors.gluonGrey} !important;
  --tv-color-pane-background: ${colors.gluonGrey} !important;

  --tv-color-toolbar-button-background-active: ${colors.liquidLava} !important;
  --tv-color-toolbar-button-background-active-hover: ${colors.liquidLava} !important;
  --tv-color-toolbar-button-text-active: ${colors.snow} !important;
  --tv-color-toolbar-button-text-active-hover: ${colors.snow} !important;

  --tv-color-popup-element-background-active: ${colors.liquidLava} !important;
  --tv-color-popup-element-toolbox-background-active-hover: ${colors.liquidLava} !important;
  --tv-color-item-active-text: ${colors.snow} !important;
}
`;

  return URL.createObjectURL(new Blob([css], { type: 'text/css' }));
}

export function TradingChart({ symbol, candlesGetter }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const customCssUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!customCssUrlRef.current) customCssUrlRef.current = createTradingViewCustomCssUrl();

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
      custom_css_url: customCssUrlRef.current,
      loading_screen: {
        backgroundColor: colors.darkVoid,
        foregroundColor: colors.liquidLava,
      },
      // Prevent chart properties from being pulled from localStorage and overriding our theme/overrides.
      disabled_features: [
        'trading_account_manager' as ChartingLibraryFeatureset,
        'use_localstorage_for_settings' as ChartingLibraryFeatureset,
      ],
      enabled_features: ['iframe_loading_same_origin' as ChartingLibraryFeatureset],
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
      if (customCssUrlRef.current) {
        URL.revokeObjectURL(customCssUrlRef.current);
        customCssUrlRef.current = null;
      }
    };
  }, [candlesGetter, symbol]);

  return <div ref={containerRef} css={styles.container} />;
}
