import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';
import { curveLinear /*, curveMonotoneX*/ } from '@visx/curve';
import debounce from 'lodash/debounce';

import {
  HistoricalPnlPeriod,
  HistoricalPnlPeriods,
  HISTORICAL_PNL_PERIODS,
} from '@/constants/abacus';
// import { STRING_KEYS } from '@/constants/localization';
import { timeUnits } from '@/constants/time';
import { breakpoints } from '@/styles';

import { useBreakpoints, useNow /*, useStringGetter*/ } from '@/hooks';

// import { Details } from '@/components/Details';
import { Output /*, OutputType, ShowSign*/ } from '@/components/Output';
// import { HorizontalSeparator } from '@/components/Separator';
import { ToggleGroup } from '@/components/ToggleGroup';

import type { TooltipContextType } from '@visx/xychart';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';
import { AxisLabelOutput } from '@/components/visx/AxisLabelOutput';
// import { TooltipContent } from '@/components/visx/TooltipContent';

import {
  getSubaccount,
  getSubaccountHistoricalPnl,
  getSubaccountId,
} from '@/state/accountSelectors';

import abacusStateManager from '@/lib/abacus';
import { formatRelativeTime } from '@/lib/dateTime';
import { isTruthy } from '@/lib/isTruthy';

import chartBackground from '/chart-background.png';

enum PnlSide {
  Profit = 'Profit',
  Loss = 'Loss',
  Flat = 'Flat',
}

export type PnlDatum = {
  id: number;
  side: PnlSide;
  subaccountId: number;
  equity: number;
  totalPnl: number;
  netTransfers: number;
  createdAt: number;
};

const PNL_TIME_RESOLUTION = 1 * timeUnits.hour;

const MS_FOR_PERIOD = {
  [HistoricalPnlPeriod.Period1d.name]: 1 * timeUnits.day,
  [HistoricalPnlPeriod.Period7d.name]: 7 * timeUnits.day,
  [HistoricalPnlPeriod.Period30d.name]: 30 * timeUnits.day,
  [HistoricalPnlPeriod.Period90d.name]: 90 * timeUnits.day,
};

type ElementProps = {
  onTooltipContext?: (tooltipContext: TooltipContextType<PnlDatum>) => void;
  onVisibleDataChange?: (data: Array<PnlDatum>) => void;
  selectedLocale: string;
  slotEmpty?: ReactNode;
};

type StyleProps = {
  className?: string;
};

type PnlChartProps = ElementProps & StyleProps;

export const PnlChart = ({
  className,
  onTooltipContext,
  onVisibleDataChange,
  selectedLocale,
  slotEmpty,
}: PnlChartProps) => {
  // const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { equity } = useSelector(getSubaccount, shallowEqual) || {};
  const now = useNow({ intervalMs: timeUnits.minute });

  // Chart data
  const pnlData = useSelector(getSubaccountHistoricalPnl, shallowEqual);
  const subaccountId = useSelector(getSubaccountId, shallowEqual);

  const [minimumRequestedZoomDomain, setMinimumRequestedZoomDomain] = useState(-Infinity);

  const [selectedPeriod, setSelectedPeriod] = useState<HistoricalPnlPeriods>(
    abacusStateManager.getHistoricalPnlPeriod() || HistoricalPnlPeriod.Period1d
  );

  /**
   * Default period in Abacus to 90d so that we can work with a larger dataset
   */
  useEffect(() => {
    abacusStateManager.setHistoricalPnlPeriod(HistoricalPnlPeriod.Period90d);
  }, [pnlData]);

  const onSelectPeriod = useCallback(
    (periodName: string) => {
      setSelectedPeriod(
        HISTORICAL_PNL_PERIODS[
          (periodName as keyof typeof HISTORICAL_PNL_PERIODS) || selectedPeriod.name
        ]
      );
    },
    [setSelectedPeriod, selectedPeriod]
  );

  const onZoomSnap = useCallback(
    debounce(
      ({ zoomDomain }: { zoomDomain?: number }) =>
        zoomDomain && setMinimumRequestedZoomDomain(zoomDomain),
      500
    ),
    [setMinimumRequestedZoomDomain]
  );

  useEffect(() => {
    const smallestRequestedPeriod = Object.entries(MS_FOR_PERIOD).find(
      ([, milliseconds]) => milliseconds >= minimumRequestedZoomDomain
    )?.[0];

    if (smallestRequestedPeriod && smallestRequestedPeriod !== selectedPeriod.name) {
      setSelectedPeriod(
        HISTORICAL_PNL_PERIODS[smallestRequestedPeriod as keyof typeof MS_FOR_PERIOD]
      );
    }
  }, [minimumRequestedZoomDomain]);

  const lastPnlTick = pnlData?.[pnlData.length - 1];

  const data = useMemo(
    () =>
      lastPnlTick
        ? [
            ...pnlData,
            equity?.current && {
              createdAtMilliseconds: now,
              netTransfers: lastPnlTick.netTransfers ?? 0,
              equity: equity.current,
              totalPnl: equity.current - (lastPnlTick.equity ?? 0) + (lastPnlTick.totalPnl ?? 0),
            },
          ]
            .filter(isTruthy)
            .map(
              (datum) =>
                ({
                  id: datum.createdAtMilliseconds,
                  subaccountId: subaccountId,
                  equity: Number(datum.equity),
                  totalPnl: Number(datum.totalPnl),
                  netTransfers: Number(datum.netTransfers),
                  createdAt: new Date(datum.createdAtMilliseconds).valueOf(),
                  side: {
                    [-1]: PnlSide.Loss,
                    [0]: PnlSide.Flat,
                    [1]: PnlSide.Profit,
                  }[Math.sign(datum.equity)],
                } as PnlDatum)
            )
        : [],
    [pnlData, equity, selectedPeriod, now]
  );

  // const latestDatum = data?.[data.length - 1];

  return (
    <Styled.Container className={className}>
      <TimeSeriesChart
        id="pnl-chart"
        selectedLocale={selectedLocale}
        data={data}
        margin={{
          left: -0.5, // left: isMobile ? -0.5 : 70,
          right: -0.5,
          top: 0,
          bottom: 32,
        }}
        padding={{
          left: 0.01,
          right: 0.01,
          top: isTablet ? 0.5 : 0.15,
          bottom: 0.1,
        }}
        series={[
          {
            dataKey: 'pnl',
            xAccessor: (datum) => datum?.createdAt,
            yAccessor: (datum) => datum?.equity,
            colorAccessor: () => 'var(--pnl-line-color)',
            getCurve: () => curveLinear,
            // getCurve: ({ zoomDomain }) =>
            //   PNL_TIME_RESOLUTION * 30 < zoomDomain && zoomDomain < PNL_TIME_RESOLUTION * 400
            //     ? curveMonotoneX
            //     : curveLinear,
            // threshold: {
            //   yAccessor: (datum) => datum?.netTransfers,
            //   aboveAreaProps: {
            //     fill: 'var(--color-positive)',
            //     fillOpacity: 0.33,
            //     strokeWidth: 1,
            //     stroke: 'var(--color-positive)',
            //   },
            //   belowAreaProps: {
            //     fill: 'var(--color-negative)',
            //     fillOpacity: 0.33,
            //     strokeWidth: 1,
            //     stroke: 'var(--color-negative)',
            //   },
            // },
          },
        ]}
        tickFormatY={(value) =>
          new Intl.NumberFormat(selectedLocale, {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumSignificantDigits: 3,
          })
            .format(Math.abs(value))
            .toLowerCase()
        }
        // renderXAxisLabel={({ tooltipData }) => {
        //   const tooltipDatum = tooltipData!.nearestDatum!.datum ?? latestDatum;

        //   return (
        //     <Styled.XAxisLabelOutput type={OutputType.DateTime} value={tooltipDatum.createdAt} />
        //   );
        // }}
        // renderYAxisLabel={({ tooltipData }) => {
        //   const tooltipDatum = tooltipData!.nearestDatum!.datum ?? latestDatum;

        //   return (
        //     <Styled.YAxisLabelOutput
        //       type={OutputType.CompactFiat}
        //       value={tooltipDatum.totalPnl}
        //       accentColor={
        //         {
        //           [PnlSide.Loss]: 'var(--color-negative)',
        //           [PnlSide.Profit]: 'var(--color-positive)',
        //           [PnlSide.Flat]: 'var(--color-layer-6)',
        //         }[tooltipDatum.side]
        //       }
        //     />
        //   );
        // }}
        // renderTooltip={({ tooltipData }) => {
        //   const { nearestDatum } = tooltipData || {};

        //   const tooltipDatum = nearestDatum?.datum ?? latestDatum;

        //   return (
        //     <TooltipContent
        //       accentColor={
        //         {
        //           [PnlSide.Loss]: 'var(--color-negative)',
        //           [PnlSide.Profit]: 'var(--color-positive)',
        //           [PnlSide.Flat]: 'var(--color-layer-6)',
        //         }[tooltipDatum.side]
        //       }
        //     >
        //       <Details
        //         layout="column"
        //         items={[
        //           {
        //             key: 'createdAt',
        //             label: stringGetter({ key: STRING_KEYS.TIME }),
        //             value: <Output type={OutputType.DateTime} value={tooltipDatum.createdAt} />,
        //           },
        //         ].filter(Boolean)}
        //       />

        //       <HorizontalSeparator />

        //       <Details
        //         layout="column"
        //         items={[
        //           {
        //             key: 'netTransfers',
        //             label: stringGetter({ key: STRING_KEYS.NET_TRANSFERS }),
        //             value: <Output type={OutputType.Fiat} value={tooltipDatum.netTransfers} />,
        //           },
        //           {
        //             key: 'equity',
        //             label: {
        //               [PnlSide.Profit]: stringGetter({
        //                 key: STRING_KEYS.NET_PROFIT,
        //               }),
        //               [PnlSide.Loss]: stringGetter({
        //                 key: STRING_KEYS.NET_LOSS,
        //               }),
        //               [PnlSide.Flat]: stringGetter({
        //                 key: STRING_KEYS.NET_ZERO,
        //               }),
        //             }[tooltipDatum.side],
        //             value: (
        //               <Styled.SignedOutput
        //                 type={OutputType.Fiat}
        //                 value={tooltipDatum.equity}
        //                 showSign={ShowSign.Both}
        //                 side={tooltipDatum.side}
        //               />
        //             ),
        //           },
        //           {
        //             key: 'totalPnl',
        //             label: stringGetter({ key: STRING_KEYS.TOTAL_VALUE }), // stringGetter({ key: STRING_KEYS.EQUITY }),
        //             value: <Output type={OutputType.Fiat} value={tooltipDatum.totalPnl} />,
        //           },
        //         ].filter(Boolean)}
        //       />
        //     </TooltipContent>
        //   );
        // }}
        renderTooltip={() => <div />}
        onTooltipContext={onTooltipContext}
        onVisibleDataChange={onVisibleDataChange}
        onZoom={onZoomSnap}
        slotEmpty={slotEmpty}
        defaultZoomDomain={MS_FOR_PERIOD[selectedPeriod.name]}
        minZoomDomain={PNL_TIME_RESOLUTION * 2}
        numGridLines={0}
        tickSpacingX={210}
        tickSpacingY={75}
      >
        <Styled.PeriodToggle>
          <ToggleGroup
            items={[
              HistoricalPnlPeriod.Period1d.name,
              HistoricalPnlPeriod.Period7d.name,
              HistoricalPnlPeriod.Period30d.name,
              HistoricalPnlPeriod.Period90d.name,
            ].map((period) => ({
              value: period,
              label: formatRelativeTime(MS_FOR_PERIOD[period], {
                locale: selectedLocale,
                relativeToTimestamp: 0,
                largestUnit: 'day',
              }),
            }))}
            value={selectedPeriod.name}
            onValueChange={onSelectPeriod}
          />
        </Styled.PeriodToggle>
      </TimeSeriesChart>
    </Styled.Container>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  position: relative;
  background: url(${chartBackground}) no-repeat center center;
`;

Styled.PeriodToggle = styled.div`
  place-self: start end;
  isolation: isolate;

  margin: 1rem;
`;

Styled.SignedOutput = styled(Output)<{ side: PnlSide }>`
  ${({ side }) =>
    ({
      [PnlSide.Loss]: css`
        /* --output-sign-color: var(--color-negative); */
        color: var(--color-negative);
      `,
      [PnlSide.Profit]: css`
        /* --output-sign-color: var(--color-positive); */
        color: var(--color-positive);
      `,
      [PnlSide.Flat]: css``,
    }[side])};
`;

Styled.XAxisLabelOutput = styled(AxisLabelOutput)`
  box-shadow: 0 0 0.5rem var(--color-layer-2);
`;

Styled.YAxisLabelOutput = styled(AxisLabelOutput)`
  --axisLabel-offset: 0.5rem;

  [data-side='left'] & {
    translate: calc(-50% - var(--axisLabel-offset)) 0;

    @media ${breakpoints.mobile} {
      translate: calc(50% + var(--axisLabel-offset)) 0;
    }
  }

  [data-side='right'] & {
    translate: calc(-50% - var(--axisLabel-offset)) 0;
  }
`;
