import { useRef, useState } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';
import styled, { css } from 'styled-components';

import type { TvWidget } from '@/constants/tvchart';

import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useTradingViewLaunchable } from '@/hooks/tradingView/useTradingViewLaunchable';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

export const TvChartLaunchable = ({ marketId }: { marketId: string }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;

  const { savedResolution } = useTradingViewLaunchable({
    marketId,
    tvWidgetRef,
    setIsChartReady,
  });

  useChartMarketAndResolution({
    currentMarketId: marketId,
    isViewingUnlaunchedMarket: true,
    tvWidget,
    isWidgetReady,
    savedResolution: savedResolution as ResolutionString,
  });

  useTradingViewTheme({
    tvWidget,
    isWidgetReady,
  });

  return (
    <$PriceChart isChartReady={isChartReady}>
      {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

      <div id="tv-price-chart" />
    </$PriceChart>
  );
};
const $PriceChart = styled.div<{ isChartReady?: boolean }>`
  ${layoutMixins.stack}
  user-select: none;
  pointer-events: initial; // allow pointer events when dialog overlay is visible

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
