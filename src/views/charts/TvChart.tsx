import { useRef, useState } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';
import styled, { css } from 'styled-components';

import type { TvWidget } from '@/constants/tvchart';

import { useChartLines } from '@/hooks/tradingView/useChartLines';
import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useOhlcCandles } from '@/hooks/tradingView/useOhlcCandles';
import { useTradingView } from '@/hooks/tradingView/useTradingView';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useTradingViewToggles } from '@/hooks/tradingView/useTradingViewToggles';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

export const TvChart = () => {
  const [isChartReady, setIsChartReady] = useState(false);

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;

  const orderLineToggleRef = useRef<HTMLElement | null>(null);
  const orderLineToggle = orderLineToggleRef.current;
  const ohlcToggleRef = useRef<HTMLElement | null>(null);
  const ohlcToggle = ohlcToggleRef.current;

  const { ohlcToggleOn, setOhlcToggleOn, orderLinesToggleOn, setOrderLinesToggleOn } =
    useTradingViewToggles();
  const { savedResolution } = useTradingView({
    tvWidgetRef,
    orderLineToggleRef,
    ohlcToggleRef,
    ohlcToggleOn,
    setIsChartReady,
  });
  useChartMarketAndResolution({
    tvWidget,
    isWidgetReady,
    savedResolution: savedResolution as ResolutionString | undefined,
  });
  const { chartLines } = useChartLines({
    tvWidget,
    orderLineToggle,
    isChartReady,
    orderLinesToggleOn,
    setOrderLinesToggleOn,
  });
  useOhlcCandles({ ohlcToggle, isChartReady, ohlcToggleOn, setOhlcToggleOn, tvWidget });
  useTradingViewTheme({ tvWidget, isWidgetReady, chartLines });

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
