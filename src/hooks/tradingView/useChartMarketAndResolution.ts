import { useEffect } from 'react';

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
  isWidgetReady,
  savedResolution,
}: {
  currentMarketId: string;
  isViewingUnlaunchedMarket?: boolean;
  tvWidget: TvWidget | null;
  isWidgetReady?: boolean;
  savedResolution?: ResolutionString;
}) => {
  const dispatch = useAppDispatch();

  const selectedResolution: string =
    useAppSelector((s) => getSelectedResolutionForMarket(s, currentMarketId)) ?? DEFAULT_RESOLUTION;

  const chart = isWidgetReady ? tvWidget?.chart() : undefined;
  const chartResolution = chart?.resolution?.();

  /**
   * @description Hook to handle changing markets - intentionally should avoid triggering on change of resolutions.
   */
  useEffect(() => {
    if (isWidgetReady && currentMarketId !== tvWidget?.activeChart().symbol()) {
      const resolution = savedResolution ?? selectedResolution;
      tvWidget?.setSymbol(currentMarketId, resolution as ResolutionString, () => {});
    }
  }, [currentMarketId, isWidgetReady]);

  /**
   * @description Hook to handle changing chart resolution
   */
  useEffect(() => {
    if (chartResolution) {
      if (chartResolution !== selectedResolution) {
        if (!isViewingUnlaunchedMarket) {
          dispatch(
            setTvChartResolution({ marketId: currentMarketId, resolution: chartResolution })
          );
        }
      }

      setVisibleRangeForResolution({ resolution: chartResolution });
    }
  }, [currentMarketId, chartResolution, isViewingUnlaunchedMarket, selectedResolution]);

  const setVisibleRangeForResolution = ({ resolution }: { resolution: ResolutionString }) => {
    // Different resolutions have different timeframes to display data efficiently.
    const defaultRange: undefined | number = isViewingUnlaunchedMarket
      ? LAUNCHABLE_MARKET_RESOLUTION_CONFIGS[resolution]?.defaultRange
      : RESOLUTION_CHART_CONFIGS[resolution].defaultRange;

    if (defaultRange) {
      const to = Date.now() / 1000;
      const from = (Date.now() - defaultRange) / 1000;

      tvWidget?.activeChart().setVisibleRange(
        {
          from,
          to,
        },
        { percentRightMargin: 10 }
      );
    }
  };
};
