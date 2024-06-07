import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { curveLinear } from '@visx/curve';
import type { TooltipContextType } from '@visx/xychart';
import { debounce, get } from 'lodash';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import {
  HISTORICAL_PNL_PERIODS,
  HistoricalPnlPeriod,
  HistoricalPnlPeriods,
} from '@/constants/abacus';
import { timeUnits } from '@/constants/time';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useNow } from '@/hooks/useNow';

import { ToggleGroup } from '@/components/ToggleGroup';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import {
  getSubaccount,
  getSubaccountHistoricalPnl,
  getSubaccountId,
} from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/configs';
import { getAppTheme } from '@/state/configsSelectors';

import abacusStateManager from '@/lib/abacus';
import { formatRelativeTime } from '@/lib/dateTime';
import { isTruthy } from '@/lib/isTruthy';
import { objectEntries } from '@/lib/objectHelpers';

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

const getPeriodFromName = (periodName: string) =>
  HISTORICAL_PNL_PERIODS[periodName as keyof typeof HISTORICAL_PNL_PERIODS];

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
  const appTheme = useAppSelector(getAppTheme);
  const { equity } = useAppSelector(getSubaccount, shallowEqual) ?? {};
  const now = useNow({ intervalMs: timeUnits.minute });

  // Chart data
  const pnlData = useAppSelector(getSubaccountHistoricalPnl, shallowEqual);
  const subaccountId = useAppSelector(getSubaccountId, shallowEqual);

  const [periodOptions, setPeriodOptions] = useState<HistoricalPnlPeriods[]>([
    HistoricalPnlPeriod.Period1d,
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState<HistoricalPnlPeriods>(
    HistoricalPnlPeriod.Period1d
  );

  const [isZooming, setIsZooming] = useState(false);

  // Fetch 90d data once in Abacus for the chart
  useEffect(() => {
    abacusStateManager.setHistoricalPnlPeriod(HistoricalPnlPeriod.Period90d);
  }, []);

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
              (datum): PnlDatum => ({
                id: datum.createdAtMilliseconds,
                subaccountId: subaccountId ?? 0,
                equity: Number(datum.equity),
                totalPnl: Number(datum.totalPnl),
                netTransfers: Number(datum.netTransfers),
                createdAt: new Date(datum.createdAtMilliseconds).valueOf(),
                side: {
                  [-1]: PnlSide.Loss,
                  0: PnlSide.Flat,
                  1: PnlSide.Profit,
                }[Math.sign(datum.equity)]!,
              })
            )
        : [],
    [pnlData, equity?.current, now, lastPnlTick, subaccountId]
  );

  const msForPeriod = useCallback(
    (period: HistoricalPnlPeriods, clampMax: Boolean = true) => {
      const earliestCreatedAt = data?.[0]?.createdAt;
      const latestCreatedAt = data?.[data.length - 1]?.createdAt;
      const maxPeriod =
        earliestCreatedAt && latestCreatedAt
          ? latestCreatedAt - earliestCreatedAt
          : 90 * timeUnits.day;
      switch (period) {
        case HistoricalPnlPeriod.Period1d:
          return clampMax ? Math.min(maxPeriod, 1 * timeUnits.day) : 1 * timeUnits.day;
        case HistoricalPnlPeriod.Period7d:
          return clampMax ? Math.min(maxPeriod, 7 * timeUnits.day) : 7 * timeUnits.day;
        case HistoricalPnlPeriod.Period30d:
          return clampMax ? Math.min(maxPeriod, 30 * timeUnits.day) : 30 * timeUnits.day;
        case HistoricalPnlPeriod.Period90d:
        default:
          return clampMax ? Math.min(maxPeriod, 90 * timeUnits.day) : 90 * timeUnits.day;
      }
    },
    [data]
  );

  const onSelectPeriod = (periodName: string) => setSelectedPeriod(getPeriodFromName(periodName));

  // Unselect selected period in toggle if user zooms in/out
  const onZoomSnap = useMemo(
    () =>
      debounce(({ zoomDomain }: { zoomDomain?: number }) => {
        if (zoomDomain) {
          const defaultPeriodIx = periodOptions.findIndex(
            // To account for slight variance from zoom animation
            (period) => Math.abs(msForPeriod(period) - zoomDomain) <= 1
          );

          if (defaultPeriodIx < 0) {
            setIsZooming(true);
          } else {
            setIsZooming(false);
            setSelectedPeriod(periodOptions[defaultPeriodIx]);
          }
        }
      }, 200),
    [periodOptions, msForPeriod]
  );

  // Snap back to default zoom domain according to selected period
  const onToggleInteract = () => setIsZooming(false);

  // Include period option if oldest pnl is older than the previous option
  // e.g. oldest pnl is 31 days old -> show 90d option
  const getPeriodOptions = useCallback(
    (oldestPnlMs: number): HistoricalPnlPeriods[] =>
      objectEntries(HISTORICAL_PNL_PERIODS).reduce(
        (acc: HistoricalPnlPeriods[], [, period], i, arr) => {
          if (oldestPnlMs < now - msForPeriod(period, false)) {
            const nextPeriod = get(arr, [i + 1, 0]);
            if (nextPeriod) {
              acc.push(getPeriodFromName(nextPeriod));
            }
          }
          return acc;
        },
        [HistoricalPnlPeriod.Period1d]
      ),
    [msForPeriod, now]
  );

  const oldestPnlCreatedAt = pnlData?.[0]?.createdAtMilliseconds;

  useEffect(() => {
    if (oldestPnlCreatedAt) {
      const options = getPeriodOptions(oldestPnlCreatedAt);
      setPeriodOptions(options);

      // default to show 7d period if there's enough data
      if (options.includes(HistoricalPnlPeriod.Period7d)) {
        setSelectedPeriod(HistoricalPnlPeriod.Period7d);
      }
    }
  }, [oldestPnlCreatedAt, getPeriodOptions]);

  const chartStyles = useMemo(
    () => ({
      background:
        appTheme === AppTheme.Light ? LIGHT_CHART_BACKGROUND_URL : DARK_CHART_BACKGROUND_URL,
      margin: {
        left: -0.5, // left: isMobile ? -0.5 : 70,
        right: -0.5,
        top: 0,
        bottom: 32,
      },
      padding: {
        left: 0.01,
        right: 0.01,
        top: isTablet ? 0.5 : 0.15,
        bottom: 0.1,
      },
    }),
    [appTheme, isTablet]
  );

  const xAccessorFunc = useCallback((datum: PnlDatum) => datum?.createdAt, []);
  const yAccessorFunc = useCallback((datum: PnlDatum) => datum?.equity, []);

  const series = useMemo(
    () => [
      {
        dataKey: 'pnl',
        xAccessor: xAccessorFunc,
        yAccessor: yAccessorFunc,
        colorAccessor: () => 'var(--pnl-line-color)',
        getCurve: () => curveLinear,
      },
    ],
    [xAccessorFunc, yAccessorFunc]
  );

  const tickFormatY = useCallback(
    (value: number) =>
      new Intl.NumberFormat(selectedLocale, {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumSignificantDigits: 3,
      })
        .format(Math.abs(value))
        .toLowerCase(),
    [selectedLocale]
  );

  const renderTooltip = useCallback(() => <div />, []);

  return (
    <$Container className={className} chartBackground={chartStyles.background}>
      <TimeSeriesChart
        selectedLocale={selectedLocale}
        data={data}
        margin={chartStyles.margin}
        padding={chartStyles.padding}
        series={series}
        tickFormatY={tickFormatY}
        renderTooltip={renderTooltip}
        onTooltipContext={onTooltipContext}
        onVisibleDataChange={onVisibleDataChange}
        onZoom={onZoomSnap}
        slotEmpty={slotEmpty}
        defaultZoomDomain={isZooming ? undefined : msForPeriod(selectedPeriod, false)}
        minZoomDomain={PNL_TIME_RESOLUTION * 2}
        numGridLines={0}
        tickSpacingX={210}
        tickSpacingY={75}
      >
        <$PeriodToggle>
          <ToggleGroup
            items={periodOptions.map((period) => ({
              value: period.name,
              label: formatRelativeTime(msForPeriod(period, false), {
                locale: selectedLocale,
                relativeToTimestamp: 0,
                largestUnit: 'day',
              }),
            }))}
            value={isZooming ? '' : selectedPeriod.name}
            onValueChange={onSelectPeriod}
            onInteraction={onToggleInteract}
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
