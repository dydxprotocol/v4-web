import { useCallback, useMemo } from 'react';

import { curveLinear } from '@visx/curve';
import styled, { css } from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { NumberSign } from '@/constants/numbers';
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
import { getVaultDetails, getVaultPnlHistory } from '@/state/vaultSelectors';

import { MustBigNumber, getNumberSign } from '@/lib/numbers';

type VaultPnlChartProps = { className?: string };

type VaultPnlDatum = ReturnType<typeof getVaultPnlHistory>[number] & { index: number };

export const VaultPnlChart = ({ className }: VaultPnlChartProps) => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const vaultDetails = useAppSelector(getVaultDetails);
  const vaultPnl = useAppSelector(getVaultPnlHistory);

  const maybeHoveredTime = undefined;
  const pnlAbsolute = vaultDetails.allTimePnl.absolute;
  const pnlDiff = 8639;
  const pnlDiffPercent = 0.1584;

  const xAccessorFunc = useCallback((datum: VaultPnlDatum) => datum?.date, []);
  const yAccessorFunc = useCallback((datum: VaultPnlDatum) => datum?.totalPnl, []);

  const data = useMemo(() => vaultPnl.map((v, index) => ({ ...v, index })), [vaultPnl]);
  const series = useMemo(
    () => [
      {
        dataKey: 'pnl',
        xAccessor: xAccessorFunc,
        yAccessor: yAccessorFunc,
        colorAccessor: () => 'var(--color-positive)',
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
  const onTooltipContext = useCallback(() => null, []);

  const chartDotsBackground = useAppSelector(getChartDotBackground);
  const { isMobile } = useBreakpoints();

  const onVisibleDataChange = useCallback((inRangeData: VaultPnlDatum[]) => {
    if (inRangeData.length === 0) {
      // do something
    }
  }, []);

  return (
    <div className={className}>
      <$TogglesContainer>
        <ToggleGroup
          size={ButtonSize.Small}
          items={[
            { value: 'pnl', label: 'Vault P&L' },
            { value: 'equity', label: 'Vault Equity' },
          ]}
          value="pnl"
          onValueChange={() => null}
        />
        <ToggleGroup
          size={ButtonSize.Small}
          items={[
            { value: '7d', label: '7d' },
            { value: '30d', label: '30d' },
            { value: '90d', label: '90d' },
          ]}
          value="7d"
          onValueChange={() => null}
        />
      </$TogglesContainer>
      <$ChartContainer>
        <$ChartBackground chartBackground={chartDotsBackground} />
        <$NumbersContainer>
          {maybeHoveredTime != null && (
            <$Time>
              <Output value={maybeHoveredTime} type={OutputType.DateTime} />
            </$Time>
          )}
          <$PnlNumbers>
            <$MainOutput value={pnlAbsolute} type={OutputType.Fiat} />
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
          // onZoom={onZoomSnap}
          // defaultZoomDomain={isZooming ? undefined : msForPeriod(selectedPeriod, false)}
          minZoomDomain={timeUnits.hour * 2}
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
