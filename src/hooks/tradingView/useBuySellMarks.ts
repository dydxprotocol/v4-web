import { useEffect } from 'react';

import { TOGGLE_ACTIVE_CLASS_NAME } from '@/constants/charts';
import { TvWidget } from '@/constants/tvchart';

import { getMarketFills } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { useAppThemeAndColorModeContext } from '../useAppThemeAndColorMode';

/**
 * @description Hook to handle marks for historic buys and sells on the TV chart
 */
export function useBuySellMarks({
  buySellMarksToggle,
  buySellMarksToggleOn,
  tvWidget,
  isChartReady,
}: {
  buySellMarksToggle: HTMLElement | null;
  buySellMarksToggleOn: boolean;
  tvWidget: TvWidget | null;
  isChartReady: boolean;
}) {
  const marketId = useAppSelector(getCurrentMarketId);
  const fills = useAppSelector(getMarketFills);
  const currentMarketFills = marketId ? fills[marketId] : undefined;

  const theme = useAppThemeAndColorModeContext();

  useEffect(
    // Update marks on toggle and on new fills and on display preference changes
    () => {
      if (!isChartReady || !tvWidget) return;

      tvWidget.onChartReady(() => {
        tvWidget.headerReady().then(() => {
          if (buySellMarksToggleOn) {
            buySellMarksToggle?.classList?.add(TOGGLE_ACTIVE_CLASS_NAME);
            tvWidget.activeChart().refreshMarks();
          } else {
            buySellMarksToggle?.classList?.remove(TOGGLE_ACTIVE_CLASS_NAME);
            tvWidget.activeChart().clearMarks();
          }
        });
      });
    },
    [buySellMarksToggleOn, buySellMarksToggle, tvWidget, isChartReady, currentMarketFills, theme]
  );
}
