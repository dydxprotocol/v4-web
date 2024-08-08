import { useEffect } from 'react';

import abacusStateManager from '@/lib/abacus';

import { useTradingViewChart } from '../useTradingViewChart';

/**
 * @description Hook to handle drawing candles with OHLC or orderbook price
 */

export const useOhlcCandles = ({
  ohlcToggle,
  isChartReady,
}: {
  ohlcToggle: HTMLElement | null;
  isChartReady: boolean;
}) => {
  const { ohlcToggleOn, setOhlcToggleOn } = useTradingViewChart();

  useEffect(() => {
    // Initialize onClick for ohlc toggle
    if (isChartReady && ohlcToggle) {
      ohlcToggle.onclick = () => setOhlcToggleOn((prev) => !prev);
    }
  }, [isChartReady, ohlcToggle, setOhlcToggleOn]);

  useEffect(
    // Update ohlc button on toggle
    () => {
      if (ohlcToggleOn) {
        ohlcToggle?.classList?.add('ohlc-active');
      } else {
        ohlcToggle?.classList?.remove('ohlc-active');
      }
      abacusStateManager.toggleOhlcCandles(ohlcToggleOn);
    },
    [ohlcToggleOn, ohlcToggle?.classList]
  );

  return { ohlcToggleOn };
};
