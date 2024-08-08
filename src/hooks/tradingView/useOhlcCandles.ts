import { Dispatch, SetStateAction, useEffect } from 'react';

import abacusStateManager from '@/lib/abacus';

/**
 * @description Hook to handle drawing candles with OHLC or orderbook price
 */

export const useOhlcCandles = ({
  ohlcToggle,
  isChartReady,
  ohlcToggleOn,
  setOhlcToggleOn,
}: {
  ohlcToggle: HTMLElement | null;
  isChartReady: boolean;
  ohlcToggleOn: boolean;
  setOhlcToggleOn: Dispatch<SetStateAction<boolean>>;
}) => {
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
