import React, { useMemo, useState } from 'react';

import { curveLinear } from '@visx/curve';
import { TooltipContextType } from '@visx/xychart';
import { debounce } from 'lodash';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { HistoricalTradingRewardsPeriod } from '@/constants/abacus';
import {
  TradingRewardsPeriod,
  tradingRewardsPeriods,
  type TradingRewardsDatum,
} from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import {
  getHistoricalTradingRewardsForPeriod,
  getTotalTradingRewards,
} from '@/state/accountSelectors';

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

export const TradingRewardsChart = ({
  selectedLocale,
  slotEmpty,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { chainTokenLabel } = useTokenConfigs();
  const rewardsHistoryStartDate = useEnvConfig('rewardsHistoryStartDateMs');
  const now = useNow({ intervalMs: timeUnits.day });

  const [tooltipContext, setTooltipContext] = useState<TooltipContextType<TradingRewardsDatum>>();
  const [isZooming, setIsZooming] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TradingRewardsPeriod>(
    TradingRewardsPeriod.PeriodAllTime
  );

  const totalTradingRewards = useSelector(getTotalTradingRewards);
  const periodTradingRewards = useSelector(
    getHistoricalTradingRewardsForPeriod(SELECTED_PERIOD.name),
    shallowEqual
  );

  const msForPeriod = (period: TradingRewardsPeriod) => {
    switch (period) {
      case TradingRewardsPeriod.Period1d:
        return 1 * timeUnits.day;
      case TradingRewardsPeriod.Period7d:
        return 7 * timeUnits.day;
      case TradingRewardsPeriod.Period30d:
        return 30 * timeUnits.day;
      case TradingRewardsPeriod.Period90d:
        return 90 * timeUnits.day;
      case TradingRewardsPeriod.PeriodAllTime:
      default:
        console.log('xcxc here', rewardsHistoryStartDate, now);
        return (now - Number(rewardsHistoryStartDate) + 1) * timeUnits.day;
    }
  };

  const zoomDomainValues = tradingRewardsPeriods.map(msForPeriod);

  // Unselect selected period in toggle if user zooms in/out
  const onZoomSnap = useMemo(
    () =>
      debounce(({ zoomDomain }: { zoomDomain?: number }) => {
        if (zoomDomain) {
          setIsZooming(!zoomDomainValues.includes(zoomDomain));
        }
      }, 200),
    []
  );

  const rewardsData = useMemo(
    () =>
      periodTradingRewards
        ? periodTradingRewards
            .toArray()
            .reverse()
            .map(
              (datum) =>
                ({
                  amount: datum.amount,
                  cumulativeAmount: datum.cumulativeAmount, // xcxc format
                  date: new Date(datum.endedAtInMilliseconds).valueOf(),
                } as TradingRewardsDatum)
            ) // xcxc constant
        : [],
    [periodTradingRewards]
  );

  console.log('xcxc', msForPeriod(selectedPeriod), selectedPeriod);

  return (
    <TimeSeriesChart
      id="trading-rewards-chart"
      className={className}
      selectedLocale={selectedLocale}
      data={rewardsData}
      yAxisOrientation="right"
      margin={{
        left: 32,
        right: 50,
        top: 32,
        bottom: 32,
      }}
      padding={{
        left: 0.01,
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
      tickFormatY={(value) =>
        Intl.NumberFormat(navigator.language || 'en-US', {
          style: 'decimal',
          notation: 'compact',
          maximumSignificantDigits: 3,
        })
          .format(value)
          .toLowerCase()
      }
      renderTooltip={() => <div />}
      onTooltipContext={setTooltipContext}
      onZoom={onZoomSnap}
      slotEmpty={slotEmpty}
      defaultZoomDomain={isZooming ? undefined : msForPeriod(selectedPeriod)}
      minZoomDomain={TRADING_REWARDS_TIME_RESOLUTION * 2} // xcxc
      numGridLines={0}
      tickSpacingX={210}
      tickSpacingY={50}
    >
      {rewardsData.length === 0 ? undefined : (
        <$Title>
          <$TitleContainer>
            <$Title>
              {stringGetter({
                key: STRING_KEYS.TRADING_REWARDS,
              })}
            </$Title>
            <$Value>
              {MustBigNumber(
                tooltipContext?.tooltipData?.nearestDatum?.datum?.cumulativeAmount ??
                  totalTradingRewards
              ).toFixed(TOKEN_DECIMALS)}
              <AssetIcon symbol={chainTokenLabel} />
            </$Value>
          </$TitleContainer>
        </$Title>
      )}
      <$PeriodToggle>
        <ToggleGroup
          items={tradingRewardsPeriods.map((period) => ({
            value: period,
            label:
              period === TradingRewardsPeriod.PeriodAllTime
                ? stringGetter({ key: STRING_KEYS.ALL })
                : formatRelativeTime(msForPeriod(period), {
                    locale: selectedLocale,
                    relativeToTimestamp: 0,
                    largestUnit: 'day',
                  }),
          }))}
          value={isZooming ? '' : selectedPeriod}
          onValueChange={(value) => setSelectedPeriod(value as TradingRewardsPeriod)}
          onInteraction={() => setIsZooming(false)}
        />
      </$PeriodToggle>
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

const $Value = styled.div`
  color: var(--color-text-2);

  ${layoutMixins.inlineRow}
  flex-basis: 100%;
`;

const $PeriodToggle = styled.div`
  place-self: start end;
  isolation: isolate;
`;
