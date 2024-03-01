import { useEffect } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';
import { useDispatch, useSelector } from 'react-redux';

import { DEFAULT_RESOLUTION, RESOLUTION_CHART_CONFIGS } from '@/constants/candles';
import { DEFAULT_MARKETID } from '@/constants/markets';
import type { TvWidget } from '@/constants/tvchart';

import { setTvChartResolution } from '@/state/perpetuals';
import { getCurrentMarketId, getSelectedResolutionForMarket } from '@/state/perpetualsSelectors';

/**
 * @description Hook to handle changing markets and setting chart resolution
 */

export const useChartMarketAndResolution = ({
  tvWidget,
  isWidgetReady,
  savedResolution,
}: {
  tvWidget: TvWidget | null;
  isWidgetReady?: boolean;
  savedResolution?: ResolutionString;
}) => {
  const dispatch = useDispatch();

  const currentMarketId: string = useSelector(getCurrentMarketId) || DEFAULT_MARKETID;

  const selectedResolution: string =
    useSelector(getSelectedResolutionForMarket(currentMarketId)) || DEFAULT_RESOLUTION;

  const chart = isWidgetReady ? tvWidget?.chart() : undefined;
  const chartResolution = chart?.resolution?.();

  /**
   * @description Hook to handle changing markets - intentionally should avoid triggering on change of resolutions.
   */
  useEffect(() => {
    if (isWidgetReady && currentMarketId !== tvWidget?.activeChart().symbol()) {
      const resolution = savedResolution || selectedResolution;
      tvWidget?.setSymbol(currentMarketId, resolution as ResolutionString, () => {});
    }
  }, [currentMarketId, isWidgetReady]);

  /**
   * @description Hook to handle changing chart resolution
   */
  useEffect(() => {
    if (chartResolution) {
      if (chartResolution !== selectedResolution) {
        dispatch(setTvChartResolution({ marketId: currentMarketId, resolution: chartResolution }));
      }

      setVisibleRangeForResolution({ resolution: chartResolution });
    }
  }, [currentMarketId, chartResolution, selectedResolution]);

  const setVisibleRangeForResolution = ({ resolution }: { resolution: ResolutionString }) => {
    // Different resolutions have different timeframes to display data efficiently.
    const { defaultRange } = RESOLUTION_CHART_CONFIGS[resolution];

    // from/to values converted to epoch seconds
    const newRange = {
      from: (Date.now() - defaultRange) / 1000,
      to: Date.now() / 1000,
    };

    tvWidget?.activeChart().setVisibleRange(newRange, { percentRightMargin: 10 });
  };
};
