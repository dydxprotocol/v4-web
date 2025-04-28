import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { BonsaiHooks } from '@/bonsai/ontology';
import { curveLinear } from '@visx/curve';
import type { TooltipContextType } from '@visx/xychart';
import { debounce } from 'lodash';
import styled from 'styled-components';

import { NORMAL_DEBOUNCE_MS } from '@/constants/debounce';
import { timeUnits } from '@/constants/time';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useNow } from '@/hooks/useNow';

import { OutputType, formatNumberOutput } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import { getSubaccountId } from '@/state/accountInfoSelectors';
import { getSubaccountEquity } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getChartDotBackground } from '@/state/appUiConfigsSelectors';

import { formatRelativeTime } from '@/lib/dateTime';
import { isTruthy } from '@/lib/isTruthy';

enum PnlSide {
  Profit = 'Profit',
  Loss = 'Loss',
  Flat = 'Flat',
}

enum HistoricalPnlPeriod {
  Period1d = '1d',
  Period7d = '7d',
  Period30d = '30d',
  Period90d = '90d',
}
const allPeriods: HistoricalPnlPeriod[] = [
  HistoricalPnlPeriod.Period1d,
  HistoricalPnlPeriod.Period7d,
  HistoricalPnlPeriod.Period30d,
  HistoricalPnlPeriod.Period90d,
];

export type PnlDatum = {
  id: number;
  side: PnlSide;
  subaccountId: number;
  equity: number;
  totalPnl: number;
  createdAt: number;
};

const PNL_TIME_RESOLUTION = 1 * timeUnits.hour;

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
  const equity = useAppSelector(getSubaccountEquity);
  const now = useNow({ intervalMs: timeUnits.minute });

  const chartDotsBackground = useAppSelector(getChartDotBackground);

  // Chart data
  const { data: pnlData } = BonsaiHooks.useParentSubaccountHistoricalPnls();
  const subaccountId = useAppSelector(getSubaccountId);

  const [periodOptions, setPeriodOptions] = useState<HistoricalPnlPeriod[]>([
    HistoricalPnlPeriod.Period1d,
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState<HistoricalPnlPeriod>(
    HistoricalPnlPeriod.Period1d
  );

  const [isZooming, setIsZooming] = useState(false);

  const lastPnlTick = pnlData?.[pnlData.length - 1];

  const data = useMemo(
    () =>
      lastPnlTick
        ? [
            ...pnlData,
            equity && {
              createdAtMilliseconds: now,
              equity,
              totalPnl: equity - (lastPnlTick.equity ?? 0) + (lastPnlTick.totalPnl ?? 0),
            },
          ]
            .filter(isTruthy)
            .map(
              (datum): PnlDatum => ({
                id: datum.createdAtMilliseconds,
                subaccountId: subaccountId ?? 0,
                equity: Number(datum.equity),
                totalPnl: Number(datum.totalPnl),
                createdAt: new Date(datum.createdAtMilliseconds).getTime(),
                side: {
                  [-1]: PnlSide.Loss,
                  0: PnlSide.Flat,
                  1: PnlSide.Profit,
                }[Math.sign(datum.equity)]!,
              })
            )
        : [],
    [pnlData, equity, now, lastPnlTick, subaccountId]
  );

  const msForPeriod = useCallback(
    (period: HistoricalPnlPeriod, clampMax: Boolean = true) => {
      const earliestCreatedAt = data[0]?.createdAt;
      const latestCreatedAt = data[data.length - 1]?.createdAt;
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

  const onSelectPeriod = (periodName: string) =>
    setSelectedPeriod(periodName as HistoricalPnlPeriod);

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
            setSelectedPeriod(periodOptions[defaultPeriodIx]!);
          }
        }
      }, NORMAL_DEBOUNCE_MS),
    [periodOptions, msForPeriod]
  );

  // Snap back to default zoom domain according to selected period
  const onToggleInteract = () => setIsZooming(false);

  // Include period option if oldest pnl is older than the previous option
  // e.g. oldest pnl is 31 days old -> show 90d option
  const getPeriodOptions = useCallback(
    (oldestPnlMs: number): HistoricalPnlPeriod[] =>
      allPeriods.reduce(
        (acc: HistoricalPnlPeriod[], period, i, arr) => {
          if (oldestPnlMs < now - msForPeriod(period, false)) {
            const nextPeriod = arr[i + 1];
            if (nextPeriod) {
              acc.push(nextPeriod);
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
    }
  }, [oldestPnlCreatedAt, getPeriodOptions]);

  useEffect(() => {
    // default to show 7d period if there's enough data
    if (periodOptions.includes(HistoricalPnlPeriod.Period7d)) {
      setSelectedPeriod(HistoricalPnlPeriod.Period7d);
      setIsZooming(false);
    }
  }, [periodOptions.includes(HistoricalPnlPeriod.Period7d)]);

  const chartStyles = useMemo(
    () => ({
      background: chartDotsBackground,
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
    [chartDotsBackground, isTablet]
  );

  const xAccessorFunc = useCallback((datum: PnlDatum | undefined) => datum?.createdAt ?? 0, []);
  const yAccessorFunc = useCallback((datum: PnlDatum | undefined) => datum?.equity ?? 0, []);

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

  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const tickFormatY = useCallback(
    (value: number) =>
      formatNumberOutput(value, OutputType.CompactFiat, {
        decimalSeparator,
        groupSeparator,
        selectedLocale,
      }),
    [decimalSeparator, groupSeparator, selectedLocale]
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
        <div tw="isolate m-1 [place-self:start_end]">
          <ToggleGroup
            items={periodOptions.map((period) => ({
              value: period,
              label: formatRelativeTime(msForPeriod(period, false), {
                locale: selectedLocale,
                relativeToTimestamp: 0,
                largestUnit: 'day',
              }),
            }))}
            value={isZooming ? '' : selectedPeriod}
            onValueChange={onSelectPeriod}
            onInteraction={onToggleInteract}
          />
        </div>
      </TimeSeriesChart>
    </$Container>
  );
};

const $Container = styled.div<{ chartBackground: string }>`
  position: relative;
  background: url(${({ chartBackground }) => chartBackground}) no-repeat center center;
`;
