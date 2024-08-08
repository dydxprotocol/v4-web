import { Dispatch, SetStateAction, useEffect } from 'react';

import { TvWidget } from '@/constants/tvchart';

import abacusStateManager from '@/lib/abacus';

/**
 * @description Hook to handle drawing candles with OHLC or orderbook price
 */

export const useOhlcCandles = ({
  ohlcToggle,
  isChartReady,
  ohlcToggleOn,
  setOhlcToggleOn,
  tvWidget,
}: {
  ohlcToggle: HTMLElement | null;
  isChartReady: boolean;
  ohlcToggleOn: boolean;
  setOhlcToggleOn: Dispatch<SetStateAction<boolean>>;
  tvWidget: TvWidget | null;
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
      tvWidget?.onChartReady(() => {
        tvWidget.headerReady().then(() => {
          if (ohlcToggleOn) {
            ohlcToggle?.classList?.add('ohlc-active');
          } else {
            ohlcToggle?.classList?.remove('ohlc-active');
          }
          abacusStateManager.toggleOhlcCandles(ohlcToggleOn);
        });
      });
    },
    [ohlcToggleOn, ohlcToggle, tvWidget]
  );

  return { ohlcToggleOn };
};
