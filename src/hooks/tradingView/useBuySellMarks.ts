import { Dispatch, SetStateAction, useEffect } from 'react';

import { TvWidget } from '@/constants/tvchart';

/**
 * @description Hook to handle marks for historic buys and sells on the TV chart
 */
export function useBuySellMarks({
  buySellMarksToggle,
  buySellMarksToggleOn,
  setBuySellMarksToggleOn,
  tvWidget,
  isChartReady,
}: {
  buySellMarksToggle: HTMLElement | null;
  buySellMarksToggleOn: boolean;
  setBuySellMarksToggleOn: Dispatch<SetStateAction<boolean>>;
  tvWidget: TvWidget | null;
  isChartReady: boolean;
}) {
  useEffect(() => {
    // Initialize onClick for orderbook candles toggle
    if (isChartReady && buySellMarksToggle) {
      buySellMarksToggle.onclick = () => setBuySellMarksToggleOn((prev) => !prev);
    }
  }, [isChartReady, buySellMarksToggle, setBuySellMarksToggleOn]);

  useEffect(
    // Update marks on toggle and on new fills
    () => {
      if (!isChartReady || !tvWidget) return;

      tvWidget.onChartReady(() => {
        tvWidget.headerReady().then(() => {
          if (buySellMarksToggleOn) {
            buySellMarksToggle?.classList?.add('toggle-active');
            tvWidget.activeChart().refreshMarks();
          } else {
            buySellMarksToggle?.classList?.remove('toggle-active');
            tvWidget.activeChart().clearMarks();
          }
        });
      });
    },
    [buySellMarksToggleOn, buySellMarksToggle, tvWidget, isChartReady]
  );
}
