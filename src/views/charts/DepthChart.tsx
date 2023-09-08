import { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent, css, keyframes } from 'styled-components';
import { useSelector, shallowEqual } from 'react-redux';

import { StringGetterFunction, STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks';

import { MustBigNumber } from '@/lib/numbers';

import { getCurrentMarketConfig, getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';

import { XYChartWithPointerEvents } from '@/components/visx/XYChartWithPointerEvents';
import {
  Axis, // AnimatedAxis,
  Grid, // AnimatedGrid,
  LineSeries,
  AreaSeries, // AnimatedAreaSeries,
  buildChartTheme,
  darkTheme,
  DataProvider,
  EventEmitterProvider,
} from '@visx/xychart';
import { LinearGradient } from '@visx/gradient';
import { curveStepAfter } from '@visx/curve';
import type { Point } from '@visx/point';
import Tooltip from '@/components/visx/XYChartTooltipWithBounds';
import { TooltipContent } from '@/components/visx/TooltipContent';
import { AxisLabelOutput } from '@/components/visx/AxisLabelOutput';

import { Details } from '@/components/Details';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { OrderSide } from '@dydxprotocol/v4-client-js';

// @ts-ignore
const theme = buildChartTheme({
  ...darkTheme,
  colors: ['var(--color-positive)', 'var(--color-negative)', 'white'], // categorical colors, mapped to series via `dataKey`s
});

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const lerp = (percent: number, from: number, to: number) => from + percent * (to - from);

const formatNumber = (n: number, selectedLocale: string, isCompact: boolean = n >= 10000) => {
  const formattedNumber = Intl.NumberFormat(selectedLocale).format(n);

  const compactNumber = Intl.NumberFormat(selectedLocale, {
    compactDisplay: 'short',
    notation: 'compact',
    minimumSignificantDigits: 2,
  }).format(n);

  return isCompact && compactNumber.length < formattedNumber.length
    ? compactNumber
    : formattedNumber;
};

enum DepthChartSeries {
  Asks = 'Asks',
  Bids = 'Bids',
  MidMarket = 'MidMarket',
}

type DepthChartDatum = {
  size: number;
  price: number;
  depth: number;
  seriesKey: DepthChartSeries;
};

const seriesKeyForOrderSide = {
  [OrderSide.BUY]: DepthChartSeries.Bids,
  [OrderSide.SELL]: DepthChartSeries.Asks,
};

type DepthChartPoint = {
  side: OrderSide;
  price: number;
  size: number;
};

export const DepthChart = ({
  onChartClick,
  stringGetter,
  selectedLocale,
}: {
  onChartClick?: (point: { side: OrderSide; price: number; size: number }) => void;
  stringGetter: StringGetterFunction;
  selectedLocale: string;
}) => {
  // Context

  const { isMobile } = useBreakpoints();

  // Chart data

  const orderbook = useSelector(getCurrentMarketOrderbook, shallowEqual);
  const { symbol = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { stepSizeDecimals, tickSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const {
    bids,
    asks,
    lowestBid,
    highestBid,
    lowestAsk,
    highestAsk,
    midMarketPrice,
    spread,
    spreadPercent,
  } = useMemo(() => {
    const bids = (orderbook?.bids?.toArray() ?? [])
      .filter(Boolean)
      .map((datum) => ({ ...datum, seriesKey: DepthChartSeries.Bids } as DepthChartDatum));

    const asks = (orderbook?.asks?.toArray() ?? [])
      .filter(Boolean)
      .map((datum) => ({ ...datum, seriesKey: DepthChartSeries.Asks } as DepthChartDatum));

    const lowestBid = bids[bids.length - 1];
    const highestBid = bids[0];
    const lowestAsk = asks[0];
    const highestAsk = asks[asks.length - 1];

    const midMarketPrice = orderbook?.midPrice;
    const spread = MustBigNumber(lowestAsk?.price ?? 0).minus(highestBid?.price ?? 0);
    const spreadPercent = orderbook?.spreadPercent;

    return {
      bids,
      asks,
      lowestBid,
      highestBid,
      lowestAsk,
      highestAsk,
      midMarketPrice,
      spread,
      spreadPercent,
    };
  }, [orderbook]);

  // Chart state

  const [isPointerPressed, setIsPointerPressed] = useState(false);
  const [chartPointAtPointer, setChartPointAtPointer] = useState<DepthChartPoint>();

  const isEditingOrder = isPointerPressed && chartPointAtPointer;

  const [zoomDomain, setZoomDomain] = useState<undefined | number>();

  useEffect(() => {
    if (!midMarketPrice) {
      setZoomDomain(undefined);
    } else if (!zoomDomain) {
      setZoomDomain(
        // Start by showing smallest of:
        Math.min(
          // Mid-market price ± 1.5%
          midMarketPrice * 0.015,
          // Mid-market price ± halfway to lowest bid
          (midMarketPrice - lowestBid.price) / 2,
          // Mid-market price ± halfway to highest ask
          (highestAsk.price - midMarketPrice) / 2
        )
      );
    }
  }, [midMarketPrice]);

  // Computations

  const { domain, range } = useMemo(() => {
    if (!(zoomDomain && midMarketPrice && asks.length && bids.length))
      return { domain: [0, 0] as const, range: [0, 0] as const };

    const domain = [
      clamp(midMarketPrice - zoomDomain, 0, highestBid.price),
      clamp(midMarketPrice + zoomDomain, lowestAsk.price, highestAsk.price),
    ] as const;

    const range = [
      0,
      [...bids, ...asks]
        .filter((datum) => datum.price >= domain[0] && datum.price <= domain[1])
        .map((datum) => datum.depth)
        .reduce((a, b) => Math.max(a, b), 0),
    ] as const;

    return { domain, range };
  }, [orderbook, zoomDomain]);

  const getChartPoint = useCallback(
    ({ x: price, y: size }: Point) =>
      ({
        side: price < midMarketPrice! ? OrderSide.BUY : OrderSide.SELL,
        price,
        size,
      } as DepthChartPoint),
    [midMarketPrice]
  );

  // Render conditions

  if (!(zoomDomain && midMarketPrice && asks.length && bids.length))
    return <LoadingSpace id="depth-chart-loading" />;

  // Events

  const onDepthChartZoom = ({
    deltaY,
    wheelDelta = deltaY,
  }: WheelEvent & { wheelDelta?: number }) => {
    setZoomDomain(
      clamp(
        Math.max(
          1e-320,
          Math.min(Number.MAX_SAFE_INTEGER, zoomDomain * Math.exp(wheelDelta / 1000))
        ),
        Math.min(midMarketPrice - highestBid.price, lowestAsk.price - midMarketPrice),
        Math.max(midMarketPrice - lowestBid.price, highestAsk.price - midMarketPrice)
      )
    );
  };

  return (
    <Styled.Container onWheel={onDepthChartZoom}>
      <DataProvider
        theme={theme}
        xScale={{
          type: 'linear',
          clamp: false,
          nice: false,
          zero: false,
          // Add 2% left and right "padding"
          domain: [lerp(-0.02, ...domain), lerp(1.02, ...domain)],
        }}
        yScale={{
          type: 'linear',
          clamp: true,
          nice: true,
          zero: true,
          // Add 5% top "padding"
          domain: [range[0], lerp(1.05, ...range)],
        }}
      >
        <EventEmitterProvider>
          <XYChartWithPointerEvents
            margin={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 32,
            }}
            onPointerUp={(point) => point && onChartClick?.(getChartPoint(point))}
            onPointerMove={(point) => point && setChartPointAtPointer(getChartPoint(point))}
            onPointerPressedChange={setIsPointerPressed}
          >
            <Axis
              orientation="bottom"
              numTicks={5}
              tickFormat={(n) => formatNumber(n, selectedLocale, zoomDomain >= 500)}
            />

            <Grid
              numTicks={4}
              lineStyle={{
                stroke: 'var(--color-border)',
                strokeWidth: 'var(--border-width)',
              }}
            />

            <AreaSeries
              dataKey={DepthChartSeries.Bids}
              data={
                bids.length
                  ? [
                      {
                        ...highestBid,
                        depth: 0,
                      },
                      ...bids,
                      {
                        ...lowestBid,
                        price: 0,
                      },
                    ].reverse()
                  : []
              }
              xAccessor={(datum: DepthChartDatum) => datum?.price}
              yAccessor={(datum: DepthChartDatum) => datum?.depth}
              curve={curveStepAfter}
              lineProps={{ strokeWidth: 1.5 }}
              fillOpacity={0.2}
              fill="url(#LinearGradient-Bids)"
            />
            <LinearGradient
              id="LinearGradient-Bids"
              from="var(--color-positive)"
              to="var(--color-positive)"
              toOpacity={0.4}
            />

            <AreaSeries
              dataKey={DepthChartSeries.Asks}
              data={
                asks.length
                  ? [
                      {
                        ...lowestAsk,
                        depth: 0,
                      },
                      ...asks,
                    ]
                  : []
              }
              xAccessor={(datum: DepthChartDatum) => datum?.price}
              yAccessor={(datum: DepthChartDatum) => datum?.depth}
              curve={curveStepAfter}
              lineProps={{ strokeWidth: 1.5 }}
              fillOpacity={0.2}
              fill="url(#LinearGradient-Asks)"
            />
            <LinearGradient
              id="LinearGradient-Asks"
              from="var(--color-negative)"
              to="var(--color-negative)"
              toOpacity={0.4}
            />

            <LineSeries
              dataKey={DepthChartSeries.MidMarket}
              data={[
                {
                  price: midMarketPrice,
                  depth: lerp(1.2, ...range),
                },
                {
                  price: midMarketPrice,
                  depth: lerp(0.5, ...range),
                },
                {
                  price: midMarketPrice,
                  depth: lerp(-0.1, ...range),
                },
              ]}
              strokeWidth={0.25}
              xAccessor={(datum) => datum?.price}
              yAccessor={(datum) => datum?.depth}
            />

            <Tooltip<DepthChartDatum>
              unstyled
              applyPositionStyle
              showDatumGlyph={!isEditingOrder}
              glyphStyle={{ radius: 6, opacity: 0.8 }}
              showVerticalCrosshair
              verticalCrosshairStyle={{ strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.7 }}
              snapCrosshairToDatumX={!isEditingOrder}
              renderXAxisLabel={({ tooltipData }) => (
                <Styled.XAxisLabelOutput
                  type={OutputType.Fiat}
                  value={
                    isEditingOrder
                      ? chartPointAtPointer.price
                      : tooltipData!.nearestDatum?.datum.price
                  }
                  useGrouping={false}
                  accentColor={
                    {
                      [DepthChartSeries.Asks]: 'var(--color-negative)',
                      [DepthChartSeries.Bids]: 'var(--color-positive)',
                      [DepthChartSeries.MidMarket]: 'var(--color-layer-6)',
                    }[
                      isEditingOrder
                        ? seriesKeyForOrderSide[chartPointAtPointer.side]
                        : (tooltipData!.nearestDatum?.key as DepthChartSeries)
                    ]
                  }
                />
              )}
              showHorizontalCrosshair
              horizontalCrosshairStyle={{ strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.7 }}
              snapCrosshairToDatumY={!isEditingOrder}
              renderYAxisLabel={({ tooltipData }) =>
                (isEditingOrder || tooltipData!.nearestDatum?.datum.depth) && (
                  <Styled.YAxisLabelOutput
                    type={OutputType.Asset}
                    value={
                      isEditingOrder
                        ? chartPointAtPointer.size
                        : tooltipData!.nearestDatum?.datum.depth
                    }
                    tag={symbol}
                    accentColor={
                      {
                        [DepthChartSeries.Asks]: 'var(--color-negative)',
                        [DepthChartSeries.Bids]: 'var(--color-positive)',
                        [DepthChartSeries.MidMarket]: 'var(--color-layer-6)',
                      }[
                        isEditingOrder
                          ? seriesKeyForOrderSide[chartPointAtPointer.side]
                          : (tooltipData!.nearestDatum?.key as DepthChartSeries)
                      ]
                    }
                  />
                )
              }
              snapTooltipToDatumX={!isEditingOrder}
              snapTooltipToDatumY={isEditingOrder ? false : isMobile}
              renderTooltip={({ tooltipData, colorScale }) => {
                const { nearestDatum } = tooltipData || {};

                if (!isEditingOrder && !nearestDatum?.datum) return null;

                return (
                  <TooltipContent
                    accentColor={colorScale?.(
                      isEditingOrder
                        ? seriesKeyForOrderSide[chartPointAtPointer.side]
                        : nearestDatum.key
                    )}
                  >
                    <h4>
                      {isEditingOrder
                        ? 'Release mouse to edit order'
                        : {
                            [DepthChartSeries.Bids]: 'Bids',
                            [DepthChartSeries.Asks]: 'Asks',
                            [DepthChartSeries.MidMarket]: 'Mid-Market',
                          }[nearestDatum.key]}
                    </h4>

                    <Details
                      layout="column"
                      items={
                        isEditingOrder
                          ? [
                              {
                                key: 'side',
                                label: stringGetter({ key: STRING_KEYS.SIDE }),
                                value: (
                                  <Output
                                    type={OutputType.Text}
                                    value={
                                      {
                                        [OrderSide.BUY]: stringGetter({
                                          key: STRING_KEYS.BUY,
                                        }),
                                        [OrderSide.SELL]: stringGetter({
                                          key: STRING_KEYS.SELL,
                                        }),
                                      }[chartPointAtPointer.side]
                                    }
                                  />
                                ),
                              },
                              {
                                key: 'limitPrice',
                                label: stringGetter({ key: STRING_KEYS.LIMIT_PRICE }),
                                value: (
                                  <Output
                                    type={OutputType.Fiat}
                                    value={chartPointAtPointer.price}
                                    useGrouping={false}
                                  />
                                ),
                              },
                              {
                                key: 'size',
                                label: stringGetter({ key: STRING_KEYS.AMOUNT }),
                                value: (
                                  <Output
                                    type={OutputType.Asset}
                                    value={chartPointAtPointer.size}
                                    fractionDigits={stepSizeDecimals}
                                    tag={symbol}
                                    useGrouping={false}
                                  />
                                ),
                              },
                            ]
                          : nearestDatum?.key === DepthChartSeries.MidMarket
                          ? [
                              {
                                key: 'midMarketPrice',
                                // label: stringGetter({ key: STRING_KEYS.ORDERBOOK_MID_MARKET_PRICE }),
                                label: stringGetter({ key: STRING_KEYS.PRICE }),
                                value: (
                                  <Output
                                    type={OutputType.Fiat}
                                    value={midMarketPrice}
                                    useGrouping={false}
                                  />
                                ),
                              },
                              {
                                key: 'spread',
                                label: stringGetter({ key: STRING_KEYS.ORDERBOOK_SPREAD }),
                                value: (
                                  <>
                                    <Output
                                      type={OutputType.Fiat}
                                      value={spread}
                                      fractionDigits={tickSizeDecimals}
                                      useGrouping={false}
                                    />
                                    <Output
                                      type={OutputType.SmallPercent}
                                      value={spreadPercent}
                                      withParentheses
                                    />
                                  </>
                                ),
                              },
                            ]
                          : [
                              {
                                key: 'price',
                                label: stringGetter({ key: STRING_KEYS.PRICE }),
                                value: (
                                  <>
                                    {nearestDatum &&
                                      {
                                        [DepthChartSeries.Bids]: '≥',
                                        [DepthChartSeries.Asks]: '≤',
                                      }[nearestDatum.key]}
                                    <Output
                                      type={OutputType.Fiat}
                                      value={nearestDatum?.datum.price}
                                      useGrouping={false}
                                    />
                                  </>
                                ),
                              },
                              {
                                key: 'depth',
                                label: stringGetter({ key: STRING_KEYS.TOTAL_SIZE }),
                                value: (
                                  <Output
                                    type={OutputType.Asset}
                                    value={nearestDatum?.datum.depth}
                                    fractionDigits={stepSizeDecimals}
                                    tag={symbol}
                                    useGrouping={false}
                                  />
                                ),
                              },
                              {
                                key: 'cost',
                                label: stringGetter({ key: STRING_KEYS.TOTAL_COST }),
                                value: (
                                  <Output
                                    useGrouping
                                    type={OutputType.Fiat}
                                    value={nearestDatum?.datum.price * nearestDatum?.datum.depth}
                                  />
                                ),
                              },
                              {
                                key: 'priceImpact',
                                label: stringGetter({ key: STRING_KEYS.PRICE_IMPACT }),
                                value: (
                                  <Output
                                    useGrouping
                                    type={OutputType.Percent}
                                    value={{
                                      [DepthChartSeries.Asks]: () =>
                                        MustBigNumber(nearestDatum.datum.price)
                                          .minus(lowestAsk.price)
                                          .div(nearestDatum.datum.price),
                                      [DepthChartSeries.Bids]: () =>
                                        MustBigNumber(highestBid.price)
                                          .minus(nearestDatum.datum.price)
                                          .div(highestBid.price),
                                    }[nearestDatum.key]()}
                                  />
                                ),
                              },
                            ]
                      }
                    />
                  </TooltipContent>
                );
              }}
            />
          </XYChartWithPointerEvents>
        </EventEmitterProvider>
      </DataProvider>
    </Styled.Container>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  width: 0;
  min-width: 100%;
  height: 0;
  min-height: 100%;
  overflow: hidden;

  font-size: 0.75rem;

  transform-style: flat;

  cursor: crosshair;
  user-select: none;

  text {
    font-feature-settings: var(--fontFeature-monoNumbers);
  }

  @media (prefers-reduced-motion: no-preference) {
    [data-state='open'] {
      animation: ${keyframes`
        from {
          opacity: 0;
          /* filter: blur(2px); */
        }
      `} 0.1s var(--ease-out-expo);
    }
    /* [data-state="closed"] { */
    &:not(:hover) [data-state] {
      animation: ${keyframes`
        to {
          opacity: 0;
          /* filter: blur(2px); */
        }
      `} 0.2s 0.3s var(--ease-out-expo) forwards;
    }
  }
`;

Styled.XAxisLabelOutput = styled(AxisLabelOutput)`
  box-shadow: 0 0 0.5rem var(--color-layer-2);
`;

Styled.YAxisLabelOutput = styled(AxisLabelOutput)`
  --axisLabel-offset: 0.5rem;

  [data-side='left'] & {
    translate: calc(50% + var(--axisLabel-offset)) 0;
  }

  [data-side='right'] & {
    translate: calc(-50% - var(--axisLabel-offset)) 0;
  }
`;
