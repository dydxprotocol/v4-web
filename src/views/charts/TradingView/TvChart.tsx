import { useEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import type { ResolutionString } from 'public/tradingview/charting_library';

import { DEFAULT_MARKETID } from '@/constants/markets';
import type { TvWidget } from '@/constants/tvchart';

import { useBuySellMarks } from '@/hooks/tradingView/useBuySellMarks';
import { useChartLines } from '@/hooks/tradingView/useChartLines';
import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useOrderbookCandles } from '@/hooks/tradingView/useOrderbookCandles';
import { useTradingView } from '@/hooks/tradingView/useTradingView';
import { useTradingViewDatafeed } from '@/hooks/tradingView/useTradingViewDatafeed';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useTradingViewToggles } from '@/hooks/tradingView/useTradingViewToggles';
import { useDydxClient } from '@/hooks/useDydxClient';
import usePrevious from '@/hooks/usePrevious';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedDisplayUnit } from '@/state/configsSelectors';
import { getCurrentMarketConfig, getCurrentMarketId } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import { BaseTvChart } from './BaseTvChart';

export const TvChart = () => {
  const [isChartReady, setIsChartReady] = useState(false);
  const currentMarketId: string = useAppSelector(getCurrentMarketId) ?? DEFAULT_MARKETID;
  const { tickSizeDecimals: tickSizeDecimalsAbacus } = orEmptyObj(
    useAppSelector(getCurrentMarketConfig)
  );

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;

  const orderLineToggleRef = useRef<HTMLElement | null>(null);
  const orderLineToggle = orderLineToggleRef.current;

  const orderbookCandlesToggleRef = useRef<HTMLElement | null>(null);
  const orderbookCandlesToggle = orderbookCandlesToggleRef.current;
  const buySellMarksToggleRef = useRef<HTMLElement | null>(null);
  const buySellMarksToggle = buySellMarksToggleRef.current;

  const [tickSizeDecimalsIndexer, setTickSizeDecimalsIndexer] = useState<{
    [marketId: string]: number | undefined;
  }>({});

  const tickSizeDecimals =
    (currentMarketId
      ? tickSizeDecimalsIndexer[currentMarketId] ?? tickSizeDecimalsAbacus
      : tickSizeDecimalsAbacus) ?? undefined;

  const { getMarketTickSize } = useDydxClient();

  useEffect(() => {
    // we only need tick size from current market for the price scale settings
    // if markets haven't been loaded via abacus, get the current market info from indexer
    (async () => {
      if (currentMarketId && tickSizeDecimals === undefined) {
        const marketTickSize = await getMarketTickSize(currentMarketId);
        setTickSizeDecimalsIndexer((prev) => ({
          ...prev,
          [currentMarketId]: BigNumber(marketTickSize).decimalPlaces() ?? undefined,
        }));
      }
    })();
  }, [currentMarketId, getMarketTickSize, tickSizeDecimals]);

  const {
    orderLinesToggleOn,
    setOrderLinesToggleOn,
    orderbookCandlesToggleOn,
    setOrderbookCandlesToggleOn,
    setBuySellMarksToggleOn,
    buySellMarksToggleOn,
  } = useTradingViewToggles();

  const { datafeed, resetCache } = useTradingViewDatafeed(
    orderbookCandlesToggleOn,
    tickSizeDecimals
  );

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
    tickSizeDecimals,
    datafeed,
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
      if (chart) {
        chart.resetData();
        resetCache();
      }
    }
  }, [displayUnit, tvWidget, isChartReady, prevDisplayUnit, resetCache]);

  return <BaseTvChart isChartReady={isChartReady} />;
};
