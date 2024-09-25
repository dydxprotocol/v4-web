import { useRef, useState } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';
import styled, { css } from 'styled-components';

import { DEFAULT_MARKETID } from '@/constants/markets';
import type { TvWidget } from '@/constants/tvchart';

import { useBuySellMarks } from '@/hooks/tradingView/useBuySellMarks';
import { useChartLines } from '@/hooks/tradingView/useChartLines';
import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useOrderbookCandles } from '@/hooks/tradingView/useOrderbookCandles';
import { useTradingView } from '@/hooks/tradingView/useTradingView';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useTradingViewToggles } from '@/hooks/tradingView/useTradingViewToggles';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

export const TvChart = () => {
  const [isChartReady, setIsChartReady] = useState(false);
  const currentMarketId: string = useAppSelector(getCurrentMarketId) ?? DEFAULT_MARKETID;

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;

  const orderLineToggleRef = useRef<HTMLElement | null>(null);
  const orderLineToggle = orderLineToggleRef.current;

  const orderbookCandlesToggleRef = useRef<HTMLElement | null>(null);
  const orderbookCandlesToggle = orderbookCandlesToggleRef.current;
  const buySellMarksToggleRef = useRef<HTMLElement | null>(null);
  const buySellMarksToggle = buySellMarksToggleRef.current;

  const {
    orderLinesToggleOn,
    setOrderLinesToggleOn,
    orderbookCandlesToggleOn,
    setOrderbookCandlesToggleOn,
    setBuySellMarksToggleOn,
    buySellMarksToggleOn,
  } = useTradingViewToggles();
  const { savedResolution } = useTradingView({
    tvWidgetRef,
    orderLineToggleRef,
    orderLinesToggleOn,
    setOrderLinesToggleOn,
    orderbookCandlesToggleRef,
    orderbookCandlesToggleOn,
    setOrderbookCandlesToggleOn,
    buySellMarksToggleRef,
    buySellMarksToggleOn,
    setBuySellMarksToggleOn,
    setIsChartReady,
  });
  useChartMarketAndResolution({
    currentMarketId,
    tvWidget,
    isWidgetReady,
    savedResolution: savedResolution as ResolutionString | undefined,
  });
  const { chartLines } = useChartLines({
    tvWidget,
    orderLineToggle,
    isChartReady,
    orderLinesToggleOn,
  });
  useOrderbookCandles({
    orderbookCandlesToggle,
    isChartReady,
    orderbookCandlesToggleOn,
    tvWidget,
  });
  useBuySellMarks({
    buySellMarksToggle,
    buySellMarksToggleOn,
    tvWidget,
    isChartReady,
  });
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
