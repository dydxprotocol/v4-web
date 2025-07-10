import { useEffect, useRef } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';

import {
  DEFAULT_RESOLUTION,
  LAUNCHABLE_MARKET_RESOLUTION_CONFIGS,
  RESOLUTION_CHART_CONFIGS,
} from '@/constants/candles';
import type { TvWidget } from '@/constants/tvchart';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getTvChartConfig } from '@/state/tradingViewSelectors';

import { getSavedResolution } from '@/lib/tradingView/utils';

/**
 * @description Hook to handle changing markets and setting chart resolution
 */

export const useChartMarketAndResolution = ({
  currentMarketId,
  isViewingUnlaunchedMarket,
  tvWidget,
}: {
  currentMarketId: string;
  isViewingUnlaunchedMarket?: boolean;
  tvWidget?: TvWidget;
}) => {
  const dispatch = useAppDispatch();
  const savedTvChartConfig = useAppSelector((s) => getTvChartConfig(s, isViewingUnlaunchedMarket));
  const savedResolution = (getSavedResolution({ savedConfig: savedTvChartConfig }) ??
    DEFAULT_RESOLUTION) as ResolutionString;

  // Use ref to use up-to-date resolution value in the next useEffect without running effect when the value changes
  const savedResolutionRef = useRef<ResolutionString>(savedResolution);
  useEffect(() => {
    savedResolutionRef.current = savedResolution;
  }, [savedResolution]);

  /**
   * @description Hook to handle changing markets and subscribe to changing resolutions
   */
  useEffect(() => {
    if (!tvWidget) return;

    tvWidget.onChartReady(() => {
      const resolution = savedResolutionRef.current;
      if (currentMarketId !== tvWidget.activeChart().symbol()) {
        tvWidget.setSymbol(currentMarketId, resolution, () => {});
      }

      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (newResolution) => {
          setVisibleRangeForResolution(tvWidget, newResolution, isViewingUnlaunchedMarket);
        });

      // Set visible range on initial render
      setVisibleRangeForResolution(tvWidget, resolution, isViewingUnlaunchedMarket);
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
