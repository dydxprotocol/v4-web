import { Dispatch, SetStateAction, useEffect } from 'react';

import { TvWidget } from '@/constants/tvchart';

import { getMarketFills } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

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
  const marketId = useAppSelector(getCurrentMarketId);
  const fills = useAppSelector(getMarketFills);
  const currentMarketFills = marketId ? fills[marketId] : undefined;

  useEffect(() => {
    // Initialize onClick for Buys/Sells toggle
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
    [buySellMarksToggleOn, buySellMarksToggle, tvWidget, isChartReady, currentMarketFills]
  );
}
