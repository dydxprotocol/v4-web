import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { curveLinear } from '@visx/curve';
import { TooltipContextType } from '@visx/xychart';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { HistoricalPnlPeriod, HistoricalTradingRewardsPeriod } from '@/constants/abacus';
import { type TradingRewardsDatum } from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';

import { useBreakpoints, useStringGetter, useTokenConfigs } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import { getHistoricalTradingRewardsForPeriod } from '@/state/accountSelectors';

import abacusStateManager from '@/lib/abacus';
import { formatRelativeTime } from '@/lib/dateTime';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  selectedLocale: string;
  slotEmpty: React.ReactNode;
};

type StyleProps = {
  className?: string;
};

const TRADING_REWARDS_TIME_RESOLUTION = 1 * timeUnits.hour; // xcxc
const SELECTED_PERIOD = HistoricalTradingRewardsPeriod.DAILY;
const DAY_RANGE = 90;

export const TradingRewardsChart = ({
  selectedLocale,
  slotEmpty,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { chainTokenLabel } = useTokenConfigs();

  const [tooltipContext, setTooltipContext] = useState<TooltipContextType<TradingRewardsDatum>>();

  // Fetch 90d data once in Abacus for the chart
  useEffect(() => {
    abacusStateManager.setHistoricalPnlPeriod(HistoricalPnlPeriod.Period90d);
  }, []);

  const periodTradingRewards = useSelector(
    getHistoricalTradingRewardsForPeriod(SELECTED_PERIOD.name),
    shallowEqual
  );

  console.log('Xcxc', periodTradingRewards);

  const rewardsData = useMemo(
    () =>
      periodTradingRewards
        ? periodTradingRewards
            .toArray()
            // .slice(0, DAY_RANGE)
            .reverse()
            .map(
              (datum) =>
                ({
                  cumulativeAmount: datum.cumulativeAmount, // xcxc format
                  date: new Date(datum.endedAtInMilliseconds).valueOf(),
                } as TradingRewardsDatum)
            ) // xcxc constant
        : [],
    [periodTradingRewards]
  );

  const formatDyDxToken = useCallback(
    (value: number) => MustBigNumber(value).toFixed(TOKEN_DECIMALS),
    []
  );

  console.log('Xcxc', rewardsData);

  return (
    <TimeSeriesChart
      id="trading-rewards-chart"
      className={className}
      selectedLocale={selectedLocale}
      yAxisOrientation="right"
      data={rewardsData}
      margin={{
        left: 0,
        right: 64,
        top: 0,
        bottom: 32,
      }}
      padding={{
        left: 0,
        right: 0.01,
        top: isTablet ? 0.5 : 0.15,
        bottom: 0.01,
      }}
      series={[
        {
          dataKey: 'trading-rewards',
          xAccessor: (datum) => datum?.date,
          yAccessor: (datum) => datum?.cumulativeAmount,
          colorAccessor: () => 'var(--trading-rewards-line-color)',
          getCurve: () => curveLinear,
        },
      ]}
      tickFormatY={formatDyDxToken}
      renderTooltip={() => <div />}
      onTooltipContext={setTooltipContext}
      //   onVisibleDataChange={onVisibleDataChange}
      //   onZoom={onZoomSnap}
      slotEmpty={slotEmpty}
      defaultZoomDomain={DAY_RANGE * timeUnits.day}
      minZoomDomain={TRADING_REWARDS_TIME_RESOLUTION * 2} // xcxc
      numGridLines={0}
    >
      {rewardsData.length === 0 ? undefined : (
        <$Title>
          <$TitleContainer>
            <$Title>
              {stringGetter({
                key: STRING_KEYS.TRADING_REWARDS,
              })}
            </$Title>
            <$Subtitle>
              {formatRelativeTime(90 * timeUnits.day, {
                locale: selectedLocale,
                relativeToTimestamp: 0,
                largestUnit: 'day',
              })}
            </$Subtitle>
            <$Value>
              {
                formatDyDxToken(
                  tooltipContext?.tooltipData?.nearestDatum?.datum?.cumulativeAmount ?? 1000
                ) //xcxc
              }
              <AssetIcon symbol={chainTokenLabel}></AssetIcon>
            </$Value>
          </$TitleContainer>
        </$Title>
      )}
    </TimeSeriesChart>
  );
};

const $TitleContainer = styled.div`
  place-self: start;
  isolation: isolate;

  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  font: var(--font-medium-book);
`;

const $Title = styled.span`
  color: var(--color-text-1);
  height: min-content;
`;

const $Subtitle = styled.span`
  color: var(--color-text-0);
`;

const $Value = styled.div`
  color: var(--color-text-2);

  ${layoutMixins.inlineRow}
  flex-basis: 100%;
`;
