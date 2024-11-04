import { useEffect, useRef, useState } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';

import { DEFAULT_MARKETID } from '@/constants/markets';
import type { TvWidget } from '@/constants/tvchart';

import { useBuySellMarks } from '@/hooks/tradingView/useBuySellMarks';
import { useChartLines } from '@/hooks/tradingView/useChartLines';
import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useOrderbookCandles } from '@/hooks/tradingView/useOrderbookCandles';
import { useTradingView } from '@/hooks/tradingView/useTradingView';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useTradingViewToggles } from '@/hooks/tradingView/useTradingViewToggles';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { BaseTvChart } from './BaseTvChart';

export const TvChart = () => {
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
    orderLinesToggleOn,
  });
  useOrderbookCandles({
    orderbookCandlesToggle,
    orderbookCandlesToggleOn,
    tvWidget,
  });
  useBuySellMarks({
    buySellMarksToggle,
    buySellMarksToggleOn,
    tvWidget,
  });
  useTradingViewTheme({ tvWidget, isWidgetReady, chartLines });

  const [isChartReady, setIsChartReady] = useState(false);
  useEffect(() => {
    setIsChartReady(false);
    tvWidget?.onChartReady(() => setIsChartReady(true));
  }, [tvWidget]);

  return <BaseTvChart isChartReady={isChartReady} />;
};
