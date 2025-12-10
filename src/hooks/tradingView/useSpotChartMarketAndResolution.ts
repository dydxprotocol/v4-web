import { useEffect, useRef } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';

import { DEFAULT_RESOLUTION, SPOT_RESOLUTION_CHART_CONFIGS } from '@/constants/candles';
import type { TvWidget } from '@/constants/tvchart';

import { useAppSelector } from '@/state/appTypes';
import { getTvChartConfig } from '@/state/tradingViewSelectors';

import { getSavedResolution } from '@/lib/tradingView/utils';

/**
 * @description Hook to handle changing spot tokens and setting chart resolution
 */

export const useSpotChartMarketAndResolution = ({
  tokenMint,
  tvWidget,
}: {
  tokenMint: string;
  tvWidget?: TvWidget;
}) => {
  const savedTvChartConfig = useAppSelector((s) => getTvChartConfig(s, false, true));
  const savedResolution = (getSavedResolution({ savedConfig: savedTvChartConfig }) ??
    DEFAULT_RESOLUTION) as ResolutionString;

  const savedResolutionRef = useRef<ResolutionString>(savedResolution);
  useEffect(() => {
    savedResolutionRef.current = savedResolution;
  }, [savedResolution]);

  useEffect(() => {
    if (!tvWidget) return;

    tvWidget.onChartReady(() => {
      const resolution = savedResolutionRef.current;
      if (tokenMint !== tvWidget.activeChart().symbol()) {
        tvWidget.setSymbol(tokenMint, resolution, () => {});
      }

      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (newResolution) => {
          setVisibleRangeForResolution(tvWidget, newResolution);
        });

      // Set visible range on initial render
      setVisibleRangeForResolution(tvWidget, resolution);
    });
  }, [tokenMint, tvWidget]);
};

const setVisibleRangeForResolution = (tvWidget: TvWidget, resolution: ResolutionString) => {
  const defaultRange: number | undefined = SPOT_RESOLUTION_CHART_CONFIGS[resolution]?.defaultRange;

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
