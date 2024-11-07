import { useEffect } from 'react';

import { TOGGLE_ACTIVE_CLASS_NAME } from '@/constants/charts';
import { TvWidget } from '@/constants/tvchart';

import abacusStateManager from '@/lib/abacus';

/**
 * @description Hook to handle drawing candles with historical trades or orderbook prices
 */
export const useOrderbookCandles = ({
  orderbookCandlesToggle,
  orderbookCandlesToggleOn,
  tvWidget,
}: {
  orderbookCandlesToggle: HTMLElement | null;
  orderbookCandlesToggleOn: boolean;
  tvWidget?: TvWidget;
}) => {
  useEffect(
    // Update orderbookCandles button on toggle
    () => {
      if (!tvWidget) return;

      tvWidget.onChartReady(() => {
        tvWidget.headerReady().then(() => {
          if (orderbookCandlesToggleOn) {
            orderbookCandlesToggle?.classList.add(TOGGLE_ACTIVE_CLASS_NAME);
          } else {
            orderbookCandlesToggle?.classList.remove(TOGGLE_ACTIVE_CLASS_NAME);
          }
          abacusStateManager.toggleOrderbookCandles(orderbookCandlesToggleOn);
        });
      });
    },
    [orderbookCandlesToggleOn, orderbookCandlesToggle, tvWidget]
  );

  return { orderbookCandlesToggleOn };
};
