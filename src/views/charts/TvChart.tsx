import { useEffect, useRef, useState } from 'react';
import styled, { type AnyStyledComponent, css } from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import type { IChartingLibraryWidget, ResolutionString } from 'public/tradingview/charting_library';

import { DEFAULT_MARKETID } from '@/constants/markets';
import { DEFAULT_RESOLUTION, RESOLUTION_CHART_CONFIGS } from '@/constants/candles';
import { useTradingView, useTradingViewTheme } from '@/hooks/tradingView';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { setTvChartResolution } from '@/state/perpetuals';

import { getCurrentMarketId, getSelectedResolutionForMarket } from '@/state/perpetualsSelectors';

import { layoutMixins } from '@/styles/layoutMixins';

type TvWidget = IChartingLibraryWidget & { _id?: string; _ready?: boolean };

export const TvChart = () => {
  const [isChartReady, setIsChartReady] = useState(false);

  const dispatch = useDispatch();
  const currentMarketId: string = useSelector(getCurrentMarketId) || DEFAULT_MARKETID;

  const selectedResolution: string =
    useSelector(getSelectedResolutionForMarket(currentMarketId)) || DEFAULT_RESOLUTION;

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;
  const chart = isWidgetReady ? tvWidget?.chart() : undefined;
  const chartResolution = chart?.resolution?.();

  const { savedResolution } = useTradingView({ tvWidgetRef, setIsChartReady });
  useTradingViewTheme({ tvWidget, isWidgetReady });

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

  useEffect(() => {
    if (chartResolution) {
      if (chartResolution !== selectedResolution) {
        dispatch(setTvChartResolution({ marketId: currentMarketId, resolution: chartResolution }));
      }

      setVisibleRangeForResolution({ resolution: chartResolution });
    }
  }, [chartResolution]);

  /**
   * @description Hook to handle changing markets
   */
  useEffect(() => {
    if (currentMarketId && isWidgetReady) {
      const resolution = savedResolution || selectedResolution;
      tvWidget?.setSymbol(currentMarketId, resolution as ResolutionString, () => {});
    }
  }, [currentMarketId, isWidgetReady]);

  return (
    <Styled.PriceChart isChartReady={isChartReady}>
      {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

      <div id="tv-price-chart" />
    </Styled.PriceChart>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.PriceChart = styled.div<{ isChartReady?: boolean }>`
  ${layoutMixins.stack}
  ${layoutMixins.perspectiveArea}

  height: 100%;

  #tv-price-chart {
    ${({ isChartReady }) =>
      !isChartReady &&
      css`
        filter: blur(3px);
        translate: 0 0 1rem;
        opacity: 0;
      `};

    @media (prefers-reduced-motion: no-preference) {
      transition: 0.2s var(--ease-out-expo);
    }
  }
`;
