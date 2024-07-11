import { useCallback, useMemo, useState } from 'react';

import { curveLinear } from '@visx/curve';
import { TooltipContextType } from '@visx/xychart';
import styled, { css } from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { NumberSign } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { timeUnits } from '@/constants/time';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';

import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType, formatNumberOutput } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import { useAppSelector } from '@/state/appTypes';
import { getChartDotBackground } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getVaultPnlHistory } from '@/state/vaultSelectors';

import { MustBigNumber, getNumberSign } from '@/lib/numbers';

type VaultPnlChartProps = { className?: string };

type VaultPnlDatum = NonNullable<ReturnType<typeof getVaultPnlHistory>>[number] & { index: number };

type EquityOrPnl = 'equity' | 'pnl';

const TIME_RANGES = [
  { value: '7d', labelKey: '7d', time: 7 * timeUnits.day },
  { value: '30d', labelKey: '30d', time: 30 * timeUnits.day },
  { value: '90d', labelKey: '90d', time: 90 * timeUnits.day },
] as const;

export const VaultPnlChart = ({ className }: VaultPnlChartProps) => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const vaultPnl = useAppSelector(getVaultPnlHistory) ?? EMPTY_ARR;

  const [selectedChart, setSelectedChart] = useState<EquityOrPnl>('pnl');
  const [visibleTimeRange, setVisibleTimeRange] = useState<[number, number] | undefined>(undefined);
  const [hoveredTime, setHoveredTime] = useState<number | undefined>(undefined);

  const data = useMemo(
    () => vaultPnl.map((v, index) => ({ ...v, index })),
    // need to churn reference so chart updates axes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vaultPnl, selectedChart]
  );

  const timeUnitsToRender = useMemo(() => {
    const dataRange = data.length > 1 ? data[data.length - 1].date - data[0].date : 0;
    return TIME_RANGES.filter((t) => t.time <= dataRange + timeUnits.day * 3).map((t) => ({
      value: t.value,
      label: t.labelKey,
    }));
  }, [data]);

  const [selectedTimeRange, setSelectedTimeRange] = useState<
    (typeof TIME_RANGES)[number]['value'] | undefined
  >(timeUnitsToRender[timeUnitsToRender.length - 1]?.value);

  const handleZoom = useCallback(({ zoomDomain }: { zoomDomain: number | undefined }) => {
    const matching = TIME_RANGES.find(
      (t) => Math.abs(t.time - (zoomDomain ?? 0)) <= timeUnits.day
    )?.value;
    setSelectedTimeRange(matching);
  }, []);
  const handleTimeRangeSelect = useCallback((timeRange: typeof selectedTimeRange | '') => {
    if (timeRange !== '') {
      setSelectedTimeRange(timeRange);
    }
  }, []);
  const pointsInView = useMemo(
    () =>
      data
        // filter out stuff outside of current view
        .filter(
          (v) =>
            visibleTimeRange == null ||
            (v.date >= visibleTimeRange[0] && v.date <= visibleTimeRange[1])
        ),
    [data, visibleTimeRange]
  );
  const relevantDataPoints = useMemo(
    () =>
      pointsInView
        // remove stuff after hover
        .filter((v) => hoveredTime == null || v.date <= hoveredTime)
        .map((v) => (selectedChart === 'equity' ? v.equity : v.totalPnl)),
    [hoveredTime, pointsInView, selectedChart]
  );
  const atLeastOnePoint = relevantDataPoints.length > 0;
  const atLeastTwoPoints = relevantDataPoints.length > 1;

  const pnlAbsolute = atLeastOnePoint
    ? relevantDataPoints[relevantDataPoints.length - 1]
    : undefined;
  const pnlDiff = atLeastTwoPoints
    ? relevantDataPoints[relevantDataPoints.length - 1] - relevantDataPoints[0]
    : undefined;
  const pnlDiffPercent = atLeastTwoPoints ? (pnlDiff ?? 0) / relevantDataPoints[0] : undefined;

  const xAccessorFunc = useCallback((datum: VaultPnlDatum) => datum?.date, []);
  const yAccessorFunc = useCallback(
    (datum: VaultPnlDatum) => (selectedChart === 'pnl' ? datum?.totalPnl : datum?.equity),
    [selectedChart]
  );

  const series = useMemo(
    () => [
      {
        dataKey: 'pnl',
        xAccessor: xAccessorFunc,
        yAccessor: yAccessorFunc,
        colorAccessor: () =>
          atLeastTwoPoints
            ? relevantDataPoints[relevantDataPoints.length - 1] - relevantDataPoints[0] >= 0
              ? 'var(--color-positive)'
              : 'var(--color-negative)'
            : 'var(--color-positive)',
        getCurve: () => curveLinear,
      },
    ],
    [xAccessorFunc, yAccessorFunc, atLeastTwoPoints, relevantDataPoints]
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
  const onTooltipContext = useCallback((tooltipData: TooltipContextType<VaultPnlDatum>) => {
    const datumTime = tooltipData.tooltipData?.nearestDatum?.datum.date;
    setHoveredTime(datumTime ?? undefined);
  }, []);

  const chartDotsBackground = useAppSelector(getChartDotBackground);
  const { isMobile } = useBreakpoints();

  const onVisibleDataChange = useCallback((inRangeData: VaultPnlDatum[]) => {
    setVisibleTimeRange(
      inRangeData.length > 1
        ? [inRangeData[0].date, inRangeData[inRangeData.length - 1].date]
        : undefined
    );
  }, []);

  const zoomDomain =
    selectedTimeRange != null
      ? TIME_RANGES.find((t) => t.value === selectedTimeRange)?.time
      : undefined;
  return (
    <div className={className}>
      <$TogglesContainer>
        <ToggleGroup
          size={ButtonSize.Small}
          items={[
            { value: 'pnl', label: 'Vault P&L' },
            { value: 'equity', label: 'Vault Equity' },
          ]}
          value={selectedChart}
          onValueChange={setSelectedChart}
        />
        <ToggleGroup
          size={ButtonSize.Small}
          // todo i81n
          items={timeUnitsToRender}
          value={selectedTimeRange ?? ''}
          onValueChange={handleTimeRangeSelect}
        />
      </$TogglesContainer>
      <$ChartContainer>
        <$ChartBackground chartBackground={chartDotsBackground} />
        <$NumbersContainer>
          {hoveredTime != null && (
            <$Time>
              <Output value={hoveredTime} type={OutputType.Date} />
            </$Time>
          )}
          <$PnlNumbers>
            <$MainOutput value={pnlAbsolute} type={OutputType.Fiat} />
            {pnlDiff != null && (
              <$DiffNumbers>
                <TriangleIndicator value={MustBigNumber(pnlDiff)} />
                <$ColoredOutput
                  $sign={getNumberSign(pnlDiff)}
                  value={pnlDiff}
                  type={OutputType.Fiat}
                />
                <$ColoredOutput
                  $sign={getNumberSign(pnlDiff)}
                  value={pnlDiffPercent}
                  type={OutputType.Percent}
                  withParentheses
                />
              </$DiffNumbers>
            )}
          </$PnlNumbers>
        </$NumbersContainer>
        <TimeSeriesChart
          selectedLocale={selectedLocale}
          data={data}
          series={series}
          yAxisOrientation="right"
          margin={{
            left: 0,
            right: isMobile ? 20 : 60,
            top: 10,
            bottom: 32,
          }}
          padding={{
            left: 0.01,
            right: 0.01,
            top: 0,
            bottom: 0,
          }}
          tickFormatY={tickFormatY}
          onVisibleDataChange={onVisibleDataChange}
          renderTooltip={renderTooltip}
          onTooltipContext={onTooltipContext}
          onZoom={handleZoom}
          defaultZoomDomain={zoomDomain}
          minZoomDomain={timeUnits.day * 2.5}
          slotEmpty={undefined}
          numGridLines={0}
          tickSpacingX={210}
          tickSpacingY={75}
        >
          {undefined}
        </TimeSeriesChart>
      </$ChartContainer>
    </div>
  );
};

const $TogglesContainer = styled.div`
  ${layoutMixins.row}
  padding-left: 1rem;
  padding-right: 1rem;
  justify-content: space-between;
`;

const $NumbersContainer = styled.div`
  ${layoutMixins.flexColumn}
  padding-left: 1rem;
  padding-right: 1rem;
`;

const $ChartContainer = styled.div`
  height: 25rem;
  margin-top: 0.5rem;
  display: grid;
  > * {
    grid-area: 1 / 1 / 2 / 2;
  }
`;

const $ChartBackground = styled.div<{ chartBackground: string }>`
  background: url(${({ chartBackground }) => chartBackground}) no-repeat center center;
  mask-image: radial-gradient(ellipse closest-side, black 40%, transparent 100%);
  pointer-events: none;
`;

const $Time = styled.div`
  font: var(--font-small-book);
  color: var(--color-text-0);
`;
const $MainOutput = styled(Output)`
  font: var(--font-medium-medium);
`;
const $PnlNumbers = styled.div`
  ${layoutMixins.row}
  font: var(--font-base-medium);
  gap: 0.5rem;
`;
const $DiffNumbers = styled.div`
  ${layoutMixins.row}
  gap: .35rem;
`;

const $ColoredOutput = styled(Output)<{ $sign: NumberSign }>`
  ${({ $sign }) =>
    $sign &&
    {
      [NumberSign.Positive]: css`
        color: var(--color-positive);
      `,
      [NumberSign.Negative]: css`
        color: var(--color-negative);
      `,
      [NumberSign.Neutral]: null,
    }[$sign]}
`;
