import { useEffect, useState } from 'react';

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
  const [useOhlc, setUseOhlc] = useState(true);

  useEffect(() => {
    // Initialize onClick for ohlc toggle
    if (isChartReady && ohlcToggle) {
      ohlcToggle.onclick = () => setUseOhlc((prev) => !prev);
    }
  }, [isChartReady, ohlcToggle]);

  useEffect(
    // Update ohlc button on toggle
    () => {
      if (useOhlc) {
        ohlcToggle?.classList?.add('ohlc-active');
      } else {
        ohlcToggle?.classList?.remove('ohlc-active');
      }
    },
    [useOhlc, ohlcToggle?.classList]
  );
};
