import { useRef, useState } from 'react';

import styled, { type AnyStyledComponent, css } from 'styled-components';

import type { ResolutionString } from 'public/tradingview/charting_library';

import type { ChartLine, TvWidget } from '@/constants/tvchart';

import {
  useChartLines,
  useChartMarketAndResolution,
  useTradingView,
  useTradingViewTheme,
} from '@/hooks/tradingView';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { layoutMixins } from '@/styles/layoutMixins';

export const TvChart = () => {
  const [isChartReady, setIsChartReady] = useState(false);

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;

  const displayButtonRef = useRef<HTMLElement | null>(null);
  const displayButton = displayButtonRef.current;

  const { savedResolution } = useTradingView({ tvWidgetRef, displayButtonRef, setIsChartReady });
  useChartMarketAndResolution({
    tvWidget,
    isWidgetReady,
    savedResolution: savedResolution as ResolutionString | undefined,
  });
  const { chartLines } = useChartLines({ tvWidget, displayButton, isChartReady });
  useTradingViewTheme({ tvWidget, isWidgetReady, chartLines });

  return (
    <Styled.PriceChart isChartReady={isChartReady}>
      {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

      <div id="tv-price-chart" />
    </Styled.PriceChart>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.PriceChart = styled.div<{ isChartReady?: boolean }>`
  ${layoutMixins.stack}

  height: 100%;

  #tv-price-chart {
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
