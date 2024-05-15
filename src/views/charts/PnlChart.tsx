import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { curveLinear } from '@visx/curve';
import type { TooltipContextType } from '@visx/xychart';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import {
  HISTORICAL_PNL_PERIODS,
  HistoricalPnlPeriod,
  HistoricalPnlPeriods,
} from '@/constants/abacus';
import { timeUnits } from '@/constants/time';

import { useBreakpoints, useNow } from '@/hooks';

import { breakpoints } from '@/styles';

import { Output } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { AxisLabelOutput } from '@/components/visx/AxisLabelOutput';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import {
  getSubaccount,
  getSubaccountHistoricalPnl,
  getSubaccountId,
} from '@/state/accountSelectors';
import { AppTheme } from '@/state/configs';
import { getAppTheme } from '@/state/configsSelectors';

import abacusStateManager from '@/lib/abacus';
import { formatRelativeTime } from '@/lib/dateTime';
import { isTruthy } from '@/lib/isTruthy';

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

const DARK_CHART_BACKGROUND_URL = '/chart-dots-background-dark.svg';
const LIGHT_CHART_BACKGROUND_URL = '/chart-dots-background-light.svg';

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
  const { isTablet } = useBreakpoints();
  const appTheme = useSelector(getAppTheme);
  const { equity } = useSelector(getSubaccount, shallowEqual) || {};
  const now = useNow({ intervalMs: timeUnits.minute });

  // Chart data
  const pnlData = useSelector(getSubaccountHistoricalPnl, shallowEqual);
  const subaccountId = useSelector(getSubaccountId, shallowEqual);

  const [selectedPeriod, setSelectedPeriod] = useState<HistoricalPnlPeriods>(
    HistoricalPnlPeriod.Period7d
  );

  /**
   * Default period in Abacus to 90d so that we can work with a larger dataset
   */
  useEffect(() => {
    abacusStateManager.setHistoricalPnlPeriod(HistoricalPnlPeriod.Period90d);
  }, []);

  const onSelectPeriod = (periodName: string) =>
    setSelectedPeriod(HISTORICAL_PNL_PERIODS[periodName as keyof typeof HISTORICAL_PNL_PERIODS]);

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
    [pnlData, equity?.current, now]
  );

  const chartBackground =
    appTheme === AppTheme.Light ? LIGHT_CHART_BACKGROUND_URL : DARK_CHART_BACKGROUND_URL;

  return (
    <$Container className={className} chartBackground={chartBackground}>
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
        renderTooltip={() => <div />}
        onTooltipContext={onTooltipContext}
        onVisibleDataChange={onVisibleDataChange}
        slotEmpty={slotEmpty}
        defaultZoomDomain={MS_FOR_PERIOD[selectedPeriod.name]}
        minZoomDomain={PNL_TIME_RESOLUTION * 2}
        numGridLines={0}
        tickSpacingX={210}
        tickSpacingY={75}
      >
        <$PeriodToggle>
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
        </$PeriodToggle>
      </TimeSeriesChart>
    </$Container>
  );
};
const $Container = styled.div<{ chartBackground: string }>`
  position: relative;
  background: url(${({ chartBackground }) => chartBackground}) no-repeat center center;
`;

const $PeriodToggle = styled.div`
  place-self: start end;
  isolation: isolate;

  margin: 1rem;
`;

const $SignedOutput = styled(Output)<{ side: PnlSide }>`
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

const $XAxisLabelOutput = styled(AxisLabelOutput)`
  box-shadow: 0 0 0.5rem var(--color-layer-2);
`;

const $YAxisLabelOutput = styled(AxisLabelOutput)`
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
