import { useCallback, useEffect, useState } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';
import styled, { css } from 'styled-components';

import { LAUNCHABLE_MARKET_RESOLUTION_CONFIGS, RESOLUTION_MAP } from '@/constants/candles';
import { TvWidget } from '@/constants/tvchart';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { objectKeys } from '@/lib/objectHelpers';

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
          <div tw="row justify-evenly gap-0.5">
            {objectKeys(isLaunchable ? LAUNCHABLE_MARKET_RESOLUTION_CONFIGS : RESOLUTION_MAP).map(
              (resolution) => (
                <button
                  tw="size-2.75 max-w-2.75 flex-1 border-b-0 border-l-0 border-r-0 border-t-2 border-solid border-color-accent"
                  type="button"
                  css={{
                    borderColor:
                      currentResolution !== resolution ? 'transparent' : 'var(--color-accent)',
                  }}
                  key={resolution}
                  onClick={() => onResolutionChange(resolution)}
                >
                  {resolution}
                </button>
              )
            )}
          </div>
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
