import { useEffect, useRef } from 'react';

import type { ResolutionString } from 'public/tradingview/charting_library';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { SPOT_TV_DEFAULT_VISIBLE_BAR_COUNT } from '@/constants/spot';
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
        .subscribe(null, () => {
          setVisibleRange(tvWidget);
        });

      setVisibleRange(tvWidget);
    });
  }, [tokenMint, tvWidget]);
};

const setVisibleRange = (tvWidget: TvWidget) => {
  const defaultBarCount = SPOT_TV_DEFAULT_VISIBLE_BAR_COUNT;
  const chart = tvWidget.activeChart();

  const handleDataLoaded = () => {
    chart
      .exportData({ includeTime: true, includeSeries: true, includedStudies: [] })
      .then((exportedData) => {
        const bars = exportedData.data;
        if (bars.length === 0) return;

        const startIndex = Math.max(0, bars.length - defaultBarCount);
        const fromBar = bars[startIndex];
        const toBar = bars[bars.length - 1];
        const from = fromBar?.[0];
        const to = toBar?.[0];

        if (from && to) {
          chart.setVisibleRange({ from, to }, { percentRightMargin: 10 });
        }
      })
      .catch(() => {
        // Fallback: do nothing, let TradingView use default zoom
      });

    // Unsubscribe after handling
    chart.onDataLoaded().unsubscribe(null, handleDataLoaded);
  };

  chart.onDataLoaded().subscribe(null, handleDataLoaded);
};
