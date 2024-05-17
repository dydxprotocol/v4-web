import React, { useMemo } from 'react';

import { curveLinear } from '@visx/curve';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { HistoricalTradingRewardsPeriod } from '@/constants/abacus';
import { timeUnits } from '@/constants/time';

import { useBreakpoints } from '@/hooks';

import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import { getHistoricalTradingRewardsForPeriod } from '@/state/accountSelectors';

type TradingRewardsDatum = {
  id: number;
  date: number;
  amount: number;
};

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
  const { isTablet } = useBreakpoints();

  const periodTradingRewards = useSelector(
    getHistoricalTradingRewardsForPeriod(SELECTED_PERIOD.name),
    shallowEqual
  );

  const rewardsData = useMemo(
    () =>
      periodTradingRewards
        ? periodTradingRewards
            .toArray()
            .slice(0, DAY_RANGE)
            .map(
              (datum) =>
                ({
                  ...datum,
                  date: new Date(datum.endedAtInMilliseconds).valueOf(),
                  id: datum.startedAtInMilliseconds, //xcxc
                } as TradingRewardsDatum)
            ) // xcxc constant
        : [],
    [periodTradingRewards]
  );

  console.log('Xcxc', rewardsData);

  return (
    <$TimeSeriesChart
      id="trading-rewards-chart"
      className={className}
      selectedLocale={selectedLocale}
      data={rewardsData}
      margin={{
        left: 0,
        right: 0,
        // left: -0.5,
        // right: -0.5,
        top: 0,
        bottom: 32,
      }}
      series={[
        {
          dataKey: 'trading-rewards',
          xAccessor: (datum) => datum?.date,
          yAccessor: (datum) => datum?.amount,
          colorAccessor: () => 'var(--trading-rewards-line-color)',
          getCurve: () => curveLinear,
        },
      ]}
      padding={{
        left: 0,
        right: 0,
        // left: 0.01,
        // right: 0.01,
        top: isTablet ? 0.5 : 0.15,
        bottom: 0.1,
      }}
      slotEmpty={slotEmpty}
      // xcxc below is dydx
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
      defaultZoomDomain={DAY_RANGE * timeUnits.day}
      minZoomDomain={TRADING_REWARDS_TIME_RESOLUTION * 2} // xcxc
      tickSpacingX={210}
      //   tickSpacingY={75}
    >
      {data.length === 0 ? undefined : 'Trading Rewards'}
    </$TimeSeriesChart>
  );
};

const $TimeSeriesChart = styled(TimeSeriesChart)`
  height: 20rem;
`;
