import { useCallback, useState } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';
import styled, { css } from 'styled-components';

import { DEFAULT_WIDGET_SETTINGS } from '@/constants/chartConfig';
import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import TradingViewWidget from '@/components/TradingViewWidget/TradingViewWidget';

import { ResolutionSelector } from './ResolutionSelector';

export const BaseTvChartWidget = ({
  symbol,
  isLaunchable,
  isSimpleUi,
  theme = 'dark',
}: {
  symbol: string;
  isLaunchable?: boolean;
  isSimpleUi?: boolean;
  theme?: 'light' | 'dark';
}) => {
  const [isChartReady, setIsChartReady] = useState(false);
  const [currentResolution, setCurrentResolution] = useState<ResolutionString>('1D');

  // Map TradingView widget intervals to resolution strings
  const getWidgetInterval = (resolution: ResolutionString): string => {
    const intervalMap: Record<ResolutionString, string> = {
      '1': '1',      // 1 minute
      '5': '5',      // 5 minutes
      '15': '15',    // 15 minutes
      '30': '30',    // 30 minutes
      '60': '60',    // 1 hour
      '240': '240',  // 4 hours
      '1D': 'D',    // 1 day
    } as const;
    return intervalMap[resolution] || 'D';
  };

  // Map widget intervals back to resolution strings
  const getResolutionFromInterval = (interval: string): ResolutionString => {
    const resolutionMap: Record<string, ResolutionString> = {
      '1': '1' as ResolutionString,
      '5': '5' as ResolutionString,
      '15': '15' as ResolutionString,
      '30': '30' as ResolutionString,
      '60': '60' as ResolutionString,
      '240': '240' as ResolutionString,
      'D': '1D' as ResolutionString,
    };
    return resolutionMap[interval] || 'D';
  };

  const onResolutionChange = useCallback(
    (resolution: ResolutionString) => {
      setCurrentResolution(resolution);
    },
    []
  );

  const handleWidgetReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  if (isSimpleUi) {
    return (
      <div tw="flexColumn h-full">
        <$PriceChart isChartReady={isChartReady}>
          {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

          <TradingViewWidget
            symbol={symbol}
            theme={theme}
            interval={getWidgetInterval(currentResolution)}
            width="100%"
            height="100%"
            onChartReady={handleWidgetReady}
            {...DEFAULT_WIDGET_SETTINGS}
          />
        </$PriceChart>

        {isChartReady && (
          <ResolutionSelector
            isLaunchable={isLaunchable}
            onResolutionChange={onResolutionChange}
            currentResolution={currentResolution}
          />
        )}
      </div>
    );
  }

  return (
    <$PriceChart isChartReady={isChartReady}>
      {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

      <TradingViewWidget
        symbol={symbol}
        theme={theme}
        interval={getWidgetInterval(currentResolution)}
        width="100%"
        height="100%"
        timezone="Etc/UTC"
        style="1"
        locale="en"
        enable_publishing={false}
        allow_symbol_change={false}
        hide_top_toolbar={false}
        hide_legend={false}
        save_image={true}
        studies={['Volume@tv-basicstudies']}
        disabled_features={['use_localstorage_for_settings']}
        enabled_features={['study_templates']}
        onChartReady={handleWidgetReady}
        autosize={true}
      />
    </$PriceChart>
  );
};

const $PriceChart = styled.div<{ isChartReady?: boolean }>`
  ${layoutMixins.stack}
  user-select: none;

  height: 100%;

  > div {
    ${({ isChartReady }) =>
      !isChartReady &&
      css`
        filter: blur(3px);
        translate: 0 0 1rem;
        opacity: 0;
      `};

    @media (prefers-reduced-motion: no-preference) {
      transition: 0.2s var(--ease-out-expo);
    }
  }
`;
