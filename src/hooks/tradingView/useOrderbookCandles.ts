import { Dispatch, SetStateAction, useEffect } from 'react';

import { TvWidget } from '@/constants/tvchart';

import abacusStateManager from '@/lib/abacus';

/**
 * @description Hook to handle drawing candles with historical trades or orderbook prices
 */
export const useOrderbookCandles = ({
  orderbookCandlesToggle,
  isChartReady,
  orderbookCandlesToggleOn,
  setOrderbookCandlesToggleOn,
  tvWidget,
}: {
  orderbookCandlesToggle: HTMLElement | null;
  isChartReady: boolean;
  orderbookCandlesToggleOn: boolean;
  setOrderbookCandlesToggleOn: Dispatch<SetStateAction<boolean>>;
  tvWidget: TvWidget | null;
}) => {
  useEffect(() => {
    // Initialize onClick for orderbook candles toggle
    if (isChartReady && orderbookCandlesToggle) {
      orderbookCandlesToggle.onclick = () => setOrderbookCandlesToggleOn((prev) => !prev);
    }
  }, [isChartReady, orderbookCandlesToggle, setOrderbookCandlesToggleOn]);

  useEffect(
    // Update orderbookCandles button on toggle
    () => {
      if (!isChartReady || !tvWidget) return;

      tvWidget.onChartReady(() => {
        tvWidget.headerReady().then(() => {
          if (orderbookCandlesToggleOn) {
            orderbookCandlesToggle?.classList?.add('toggle-active');
          } else {
            orderbookCandlesToggle?.classList?.remove('toggle-active');
          }
          abacusStateManager.toggleOrderbookCandles(orderbookCandlesToggleOn);
        });
      });
    },
    [orderbookCandlesToggleOn, orderbookCandlesToggle, tvWidget, isChartReady]
  );

  return { orderbookCandlesToggleOn };
};
