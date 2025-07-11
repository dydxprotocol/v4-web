import { useCallback, useEffect, useState } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';
import styled, { css } from 'styled-components';

import { TvWidget } from '@/constants/tvchart';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { ResolutionSelector } from './ResolutionSelector';

export const BaseTvChart = ({
  tvWidget,
  isLaunchable,
  isSimpleUi,
}: {
  tvWidget?: TvWidget | null;
  isLaunchable?: boolean;
  isSimpleUi?: boolean;
}) => {
  const [isChartReady, setIsChartReady] = useState(false);
  const [currentResolution, setCurrentResolution] = useState<ResolutionString>();

  useEffect(() => {
    setIsChartReady(false);
    let dead = false;
    tvWidget?.onChartReady(() => {
      if (dead) return;
      setIsChartReady(true);
      setCurrentResolution(tvWidget.activeChart().resolution());
    });
    return () => {
      dead = true;
    };
  }, [tvWidget]);

  const onResolutionChange = useCallback(
    (resolution: ResolutionString) => {
      if (isChartReady) {
        tvWidget?.activeChart().setResolution(resolution);
        setCurrentResolution(resolution);
      }
    },
    [isChartReady, tvWidget]
  );

  if (isSimpleUi) {
    return (
      <div tw="flexColumn h-full">
        <$PriceChart isChartReady={isChartReady}>
          {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

          <div id="tv-price-chart" />
        </$PriceChart>

        {isChartReady && (
          <ResolutionSelector
            isLaunchable={isLaunchable}
            onResolutionChange={onResolutionChange}
            currentResolution={currentResolution}
          />
        )}
      </div>
    );
  }

  return (
    <$PriceChart isChartReady={isChartReady}>
      {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

      <div id="tv-price-chart" />
    </$PriceChart>
  );
};

const $PriceChart = styled.div<{ isChartReady?: boolean }>`
  ${layoutMixins.stack}
  user-select: none;

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
