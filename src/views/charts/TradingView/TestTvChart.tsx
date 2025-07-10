import { useEffect, useRef, useState } from 'react';

import {
  type IChartingLibraryWidget,
  LanguageCode,
  widget as Widget,
} from 'public/charting_library';
import DataFeed from 'public/datafeed';
import styled from 'styled-components';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

export const TestTvChart = () => {
  const [isChartReady, setIsChartReady] = useState(false);
  const tvWidgetRef = useRef<(IChartingLibraryWidget & { _id?: string; _ready?: boolean }) | null>(
    null
  );
  /**
   * Hook to initialize TradingView Chart
   */
  useEffect(() => {
    const widgetOptions = {
      // debug: true,
      container: 'tv-price-chart',
      library_path: '/charting_library/', // relative to public folder
      custom_css_url: '/tradingview/custom-styles.css',
      locale: 'en' as LanguageCode,
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

    const options = {
      ...widgetOptions,
      datafeed: DataFeed,
      symbol: 'Bitfinex:BTC/USD',
      interval: '1D',
    };

    // @ts-ignore
    const tvChartWidget = new Widget(options);
    tvWidgetRef.current = tvChartWidget;

    tvWidgetRef.current.onChartReady(() => {
      setIsChartReady(true);
    });

    return () => {
      tvWidgetRef.current?.remove();
      tvWidgetRef.current = null;
      setIsChartReady(false);
    };
  }, []);

  return (
    <$PriceChart>
      {!isChartReady && <LoadingSpace id="tv-chart-loading" />}
      <$ChartContainer isChartReady={isChartReady}>
        <div id="tv-price-chart" />
      </$ChartContainer>
    </$PriceChart>
  );
};

const $PriceChart = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const $ChartContainer = styled.div<{ isChartReady?: boolean }>`
  height: 100%;
  display: flex;
  #tv-price-chart {
    flex: 1 1 auto;
  }
  opacity: ${({ isChartReady }) => (isChartReady ? 1 : 0)};
`;
