import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { curveLinear } from '@visx/curve';
import { type TooltipContextType } from '@visx/xychart';
import { get } from 'lodash';

import { timeUnits } from '@/constants/time';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useNow } from '@/hooks/useNow';

import { OutputType, formatNumberOutput } from '@/components/Output';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

export enum PnlSide {
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
  createdAt: number;
};

export enum HistoricalPnlPeriod {
  Period1d = 'Period1d',
  Period7d = 'Period7d',
  Period30d = 'Period30d',
  Period90d = 'Period90d',
}

export function getMsForPeriod(
  period: HistoricalPnlPeriod,
  earliestDate?: number,
  latestDate?: number,
  clampMax: boolean = true
) {
  const maxPeriod = earliestDate && latestDate ? latestDate - earliestDate : 90 * timeUnits.day;
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
}

const PNL_TIME_RESOLUTION = 1 * timeUnits.hour;

type ElementProps = {
  data: PnlDatum[];
  onTooltipContext?: (tooltipContext: TooltipContextType<PnlDatum>) => void;
  onVisibleDataChange?: (data: Array<PnlDatum>) => void;
  selectedLocale: string;
  slotEmpty?: ReactNode;
  selectedPeriod: HistoricalPnlPeriod;
};

type StyleProps = {
  className?: string;
};

type PnlChartProps = ElementProps & StyleProps;

const SimplePnlChart = ({
  className,
  data,
  onTooltipContext,
  onVisibleDataChange,
  selectedLocale,
  slotEmpty,
  selectedPeriod = HistoricalPnlPeriod.Period7d,
}: PnlChartProps) => {
  const now = useNow({ intervalMs: timeUnits.minute });

  // Chart data

  const [, setPeriodOptions] = useState<HistoricalPnlPeriod[]>([HistoricalPnlPeriod.Period1d]);

  const msForPeriod = useCallback(
    (period: HistoricalPnlPeriod, clampMax: boolean = true) => {
      const earliestCreatedAt = data[0]?.createdAt;
      const latestCreatedAt = data[data.length - 1]?.createdAt;
      return getMsForPeriod(period, earliestCreatedAt, latestCreatedAt, clampMax);
    },
    [data]
  );

  // Include period option if oldest pnl is older than the previous option
  // e.g. oldest pnl is 31 days old -> show 90d option
  const getPeriodOptions = useCallback(
    (oldestPnlMs: number): HistoricalPnlPeriod[] =>
      [
        HistoricalPnlPeriod.Period1d,
        HistoricalPnlPeriod.Period7d,
        HistoricalPnlPeriod.Period30d,
        HistoricalPnlPeriod.Period90d,
      ].reduce(
        (acc: HistoricalPnlPeriod[], period, i, arr) => {
          if (oldestPnlMs < now - msForPeriod(period, false)) {
            const nextPeriod = get(arr, [i + 1, 0]);
            if (nextPeriod) {
              acc.push(nextPeriod as HistoricalPnlPeriod);
            }
          }
          return acc;
        },
        [HistoricalPnlPeriod.Period1d]
      ),
    [msForPeriod, now]
  );

  const oldestPnlCreatedAt = data[0]?.createdAt;

  useEffect(() => {
    if (oldestPnlCreatedAt) {
      const options = getPeriodOptions(oldestPnlCreatedAt);
      setPeriodOptions(options);
    }
  }, [oldestPnlCreatedAt, getPeriodOptions]);

  const chartStyles = useMemo(
    () => ({
      margin: {
        left: -0.5,
        right: -0.5,
        top: 0,
        bottom: -0.5,
      },
      padding: {
        left: 0,
        right: 0,
        top: 1,
        bottom: 0,
      },
    }),
    []
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
        threshold: {
          yAccessor: () => 0,
          aboveAreaProps: {
            fill: 'var(--pnl-line-color)',
            fillTo: 'var(--color-layer-2)',
            fillOpacity: 0.3,
            strokeWidth: 1,
            stroke: 'var(--pnl-line-color)',
          },
        },
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
    <div tw="relative" className={className}>
      <TimeSeriesChart
        disableZoom
        selectedLocale={selectedLocale}
        data={data}
        margin={chartStyles.margin}
        padding={chartStyles.padding}
        series={series}
        tickFormatY={tickFormatY}
        renderTooltip={renderTooltip}
        onTooltipContext={onTooltipContext}
        onVisibleDataChange={onVisibleDataChange}
        slotEmpty={slotEmpty}
        defaultZoomDomain={msForPeriod(selectedPeriod, false)}
        minZoomDomain={PNL_TIME_RESOLUTION * 2}
        numGridLines={0}
        tickSpacingX={210}
        tickSpacingY={75}
        withXAxis={false}
      />
    </div>
  );
};

export default SimplePnlChart;
