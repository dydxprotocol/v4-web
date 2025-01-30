import { useEffect } from 'react';

import { TOGGLE_ACTIVE_CLASS_NAME } from '@/constants/charts';
import { TvWidget } from '@/constants/tvchart';

import { getIsAccountConnected, getMarketFills } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { useAppThemeAndColorModeContext } from '../useAppThemeAndColorMode';

/**
 * @description Hook to handle marks for historic buys and sells on the TV chart
 */
export function useBuySellMarks({
  buySellMarksToggle,
  buySellMarksToggleOn,
  tvWidget,
}: {
  buySellMarksToggle: HTMLElement | null;
  buySellMarksToggleOn: boolean;
  tvWidget?: TvWidget;
}) {
  const marketId = useAppSelector(getCurrentMarketId);
  const fills = useAppSelector(getMarketFills);
  const currentMarketFills = marketId ? fills[marketId] : undefined;

  const isAccountConnected = useAppSelector(getIsAccountConnected);
  const theme = useAppThemeAndColorModeContext();

  useEffect(
    // Update marks on toggle and on new fills and on display preference changes
    () => {
      if (!tvWidget) return;

      tvWidget.onChartReady(() => {
        tvWidget.headerReady().then(() => {
          if (buySellMarksToggleOn) {
            buySellMarksToggle?.classList.add(TOGGLE_ACTIVE_CLASS_NAME);
          } else {
            buySellMarksToggle?.classList.remove(TOGGLE_ACTIVE_CLASS_NAME);
          }

          if (buySellMarksToggleOn && isAccountConnected) {
            tvWidget.activeChart().refreshMarks();
          } else {
            tvWidget.activeChart().clearMarks();
          }
        });
      });
    },
    [
      buySellMarksToggleOn,
      isAccountConnected,
      buySellMarksToggle,
      tvWidget,
      currentMarketFills,
      theme,
    ]
  );
}
