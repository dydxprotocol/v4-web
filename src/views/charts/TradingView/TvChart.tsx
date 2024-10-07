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
import usePrevious from '@/hooks/usePrevious';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedDisplayUnit } from '@/state/configsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { BaseTvChart } from './BaseTvChart';

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

  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const prevDisplayUnit = usePrevious(displayUnit);

  useEffect(() => {
    if (!isChartReady || !tvWidget) return;

    // Only reset data if displayUnit has actually changed
    if (prevDisplayUnit !== displayUnit) {
      const chart = tvWidget.activeChart?.();
      chart?.resetData();
    }
  }, [displayUnit, tvWidget, isChartReady, prevDisplayUnit]);

  return <BaseTvChart isChartReady={isChartReady} />;
};
