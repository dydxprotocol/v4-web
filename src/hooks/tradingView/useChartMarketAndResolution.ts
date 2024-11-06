import { useEffect, useRef } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';

import {
  DEFAULT_RESOLUTION,
  LAUNCHABLE_MARKET_RESOLUTION_CONFIGS,
  RESOLUTION_CHART_CONFIGS,
} from '@/constants/candles';
import type { TvWidget } from '@/constants/tvchart';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setTvChartResolution } from '@/state/perpetuals';
import { getSelectedResolutionForMarket } from '@/state/perpetualsSelectors';

/**
 * @description Hook to handle changing markets and setting chart resolution
 */

export const useChartMarketAndResolution = ({
  currentMarketId,
  isViewingUnlaunchedMarket,
  tvWidget,
  savedResolution,
}: {
  currentMarketId: string;
  isViewingUnlaunchedMarket?: boolean;
  tvWidget?: TvWidget;
  savedResolution?: ResolutionString;
}) => {
  const dispatch = useAppDispatch();
  const selectedResolution = (useAppSelector((s) =>
    getSelectedResolutionForMarket(s, currentMarketId)
  ) ?? DEFAULT_RESOLUTION) as ResolutionString;
  const initialResolutionRef = useRef<ResolutionString>(savedResolution ?? selectedResolution);

  /**
   * @description Hook to handle changing markets and subscribe to changing resolutions
   */
  useEffect(() => {
    if (!tvWidget) return;

    tvWidget.onChartReady(() => {
      const initialResolution = initialResolutionRef.current;
      if (currentMarketId !== tvWidget.activeChart().symbol()) {
        tvWidget.setSymbol(currentMarketId, initialResolution, () => {});
      }

      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (newResolution) => {
          setVisibleRangeForResolution(tvWidget, newResolution, isViewingUnlaunchedMarket);
          if (!isViewingUnlaunchedMarket) {
            dispatch(
              setTvChartResolution({ marketId: currentMarketId, resolution: newResolution })
            );
          }
        });

      // Set visible range on initial render
      setVisibleRangeForResolution(tvWidget, initialResolution, isViewingUnlaunchedMarket);
    });
  }, [currentMarketId, tvWidget, isViewingUnlaunchedMarket, dispatch]);
};

const setVisibleRangeForResolution = (
  tvWidget: TvWidget,
  resolution: ResolutionString,
  isViewingUnlaunchedMarket?: boolean
) => {
  // Different resolutions have different timeframes to display data efficiently.
  const defaultRange: number | undefined = isViewingUnlaunchedMarket
    ? LAUNCHABLE_MARKET_RESOLUTION_CONFIGS[resolution]?.defaultRange
    : RESOLUTION_CHART_CONFIGS[resolution]?.defaultRange;

  if (defaultRange) {
    const to = Date.now() / 1000;
    const from = (Date.now() - defaultRange) / 1000;

    tvWidget.activeChart().setVisibleRange(
      {
        from,
        to,
      },
      { percentRightMargin: 10 }
    );
  }
};
