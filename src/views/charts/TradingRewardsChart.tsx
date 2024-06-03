import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { kollections } from '@dydxprotocol/v4-abacus';
import { curveLinear } from '@visx/curve';
import { TooltipContextType } from '@visx/xychart';
import { debounce } from 'lodash';
import styled from 'styled-components';

import {
  HistoricalTradingReward,
  HistoricalTradingRewardsPeriod,
  Nullable,
} from '@/constants/abacus';
import {
  TradingRewardsPeriod,
  tradingRewardsPeriods,
  type TradingRewardsDatum,
} from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';

import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useNow } from '@/hooks/useNow';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import {
  getHistoricalTradingRewardsForPeriod,
  getTotalTradingRewards,
} from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

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

const TRADING_REWARDS_TIME_RESOLUTION = 1 * timeUnits.hour;
const SELECTED_PERIOD = HistoricalTradingRewardsPeriod.DAILY;

const CHART_STYLES = {
  margin: { left: 32, right: 48, top: 12, bottom: 32 },
  padding: {
    left: 0.01,
    right: 0.01,
    top: 0.5,
    bottom: 0.01,
  },
};

export const TradingRewardsChart = ({
  selectedLocale,
  slotEmpty,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const rewardsHistoryStartDate = useEnvConfig('rewardsHistoryStartDateMs');
  const now = useNow({ intervalMs: timeUnits.minute });

  const [periodOptions, setPeriodOptions] = useState<TradingRewardsPeriod[]>([
    TradingRewardsPeriod.Period1d,
  ]);
  const [tooltipContext, setTooltipContext] = useState<TooltipContextType<TradingRewardsDatum>>();
  const [isZooming, setIsZooming] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TradingRewardsPeriod>(
    TradingRewardsPeriod.PeriodAllTime
  );
  const [defaultZoomDomain, setDefaultZoomDomain] = useState<number | undefined>(undefined);

  const canViewAccount = useAppSelector(calculateCanViewAccount);
  const totalTradingRewards = useAppSelector(getTotalTradingRewards);
  const periodTradingRewards: Nullable<kollections.List<HistoricalTradingReward>> =
    useParameterizedSelector(getHistoricalTradingRewardsForPeriod, SELECTED_PERIOD.name);

  useEffect(() => {
    // Initialize daily data for rewards chart
    abacusStateManager.setHistoricalTradingRewardPeriod(HistoricalTradingRewardsPeriod.DAILY);
  }, [canViewAccount]);

  const rewardsData = useMemo(
    () =>
      periodTradingRewards && canViewAccount
        ? periodTradingRewards
            .toArray()
            .reverse()
            .map(
              (datum): TradingRewardsDatum => ({
                date: new Date(datum.endedAtInMilliseconds).valueOf(),
                cumulativeAmount: datum.cumulativeAmount,
              })
            )
        : [],
    [periodTradingRewards, canViewAccount]
  );

  const oldestDataPointDate = rewardsData?.[0]?.date;
  const newestDataPointDate = rewardsData?.[rewardsData.length - 1]?.date;

  const msForPeriod = useCallback(
    (period: TradingRewardsPeriod, clampMax: Boolean = true) => {
      const earliestDatum = oldestDataPointDate ?? Number(rewardsHistoryStartDate);
      const latestDatum = newestDataPointDate ?? now;
      const maxPeriod = latestDatum - earliestDatum;

      switch (period) {
        case TradingRewardsPeriod.Period1d:
          return clampMax ? Math.min(maxPeriod, 1 * timeUnits.day) : 1 * timeUnits.day;
        case TradingRewardsPeriod.Period7d:
          return clampMax ? Math.min(maxPeriod, 7 * timeUnits.day) : 7 * timeUnits.day;
        case TradingRewardsPeriod.Period30d:
          return clampMax ? Math.min(maxPeriod, 30 * timeUnits.day) : 30 * timeUnits.day;
        case TradingRewardsPeriod.Period90d:
          return clampMax ? Math.min(maxPeriod, 90 * timeUnits.day) : 90 * timeUnits.day;
        case TradingRewardsPeriod.PeriodAllTime:
        default:
          return maxPeriod;
      }
    },
    [now, rewardsHistoryStartDate, newestDataPointDate, oldestDataPointDate]
  );

  // Include period option only if oldest date is older it
  // e.g. oldest date is 31 days old -> show 30d option, but not 90d
  const getPeriodOptions = useCallback(
    (oldestMs: number): TradingRewardsPeriod[] =>
      tradingRewardsPeriods.reduce((acc: TradingRewardsPeriod[], period) => {
        if (oldestMs <= (newestDataPointDate ?? now) - msForPeriod(period, false)) {
          acc.push(period);
        }
        return acc;
      }, []),
    [msForPeriod, newestDataPointDate, now]
  );

  useEffect(() => {
    if (oldestDataPointDate) {
      const options = getPeriodOptions(oldestDataPointDate);
      setPeriodOptions(options);
    }
  }, [oldestDataPointDate, getPeriodOptions]);

  // Update selected period in toggle if user zooms in/out
  const onZoomSnap = useMemo(
    () =>
      debounce(({ zoomDomain }: { zoomDomain?: number }) => {
        if (zoomDomain) {
          const predefinedPeriodIx = periodOptions.findIndex(
            // To account for slight variance from zoom animation
            (period) => Math.abs(msForPeriod(period) - zoomDomain) <= 1
          );
          if (predefinedPeriodIx < 0) {
            // Unselect period
            setIsZooming(true);
          } else {
            // Update period to new selected period
            setIsZooming(false);
            setSelectedPeriod(periodOptions[predefinedPeriodIx]);
          }
        }
      }, 200),
    [periodOptions, msForPeriod]
  );

  useEffect(() => {
    if (isZooming) {
      setDefaultZoomDomain(undefined);
    } else {
      setDefaultZoomDomain(msForPeriod(selectedPeriod));
    }
  }, [isZooming, msForPeriod, selectedPeriod]);

  const onToggleInteract = () => setIsZooming(false);

  const xAccessorFunc = useCallback((datum: TradingRewardsDatum) => datum?.date, []);
  const yAccessorFunc = useCallback((datum: TradingRewardsDatum) => datum?.cumulativeAmount, []);

  const series = useMemo(
    () => [
      {
        dataKey: 'trading-rewards',
        xAccessor: xAccessorFunc,
        yAccessor: yAccessorFunc,
        colorAccessor: () => 'var(--trading-rewards-line-color)',
        getCurve: () => curveLinear,
      },
    ],
    [xAccessorFunc, yAccessorFunc]
  );

  const language = navigator.language || 'en-US';

  const tickFormatY = useCallback(
    (value: number) =>
      Intl.NumberFormat(language, {
        style: 'decimal',
        notation: 'compact',
        maximumSignificantDigits: 3,
      })
        .format(value)
        .toLowerCase(),
    [language]
  );

  const renderTooltip = useCallback(() => <div />, []);

  const toggleGroupItems = useMemo(() => {
    return periodOptions.map((period: TradingRewardsPeriod) => ({
      value: period,
      label:
        period === TradingRewardsPeriod.PeriodAllTime
          ? stringGetter({ key: STRING_KEYS.ALL })
          : formatRelativeTime(msForPeriod(period, false), {
              locale: selectedLocale,
              relativeToTimestamp: 0,
              largestUnit: 'day',
            }),
    }));
  }, [stringGetter, msForPeriod, selectedLocale, periodOptions]);

  const setTradingRewardsPeriod = useCallback((value: string) => {
    setSelectedPeriod(value as TradingRewardsPeriod);
  }, []);

  return (
    <>
      {rewardsData.length === 0 ? undefined : (
        <$TitleContainer>
          <$Title>
            {stringGetter({
              key: STRING_KEYS.TRADING_REWARDS,
            })}
          </$Title>

          <ToggleGroup
            items={toggleGroupItems}
            value={isZooming ? '' : selectedPeriod}
            onValueChange={setTradingRewardsPeriod}
            onInteraction={onToggleInteract}
          />
        </$TitleContainer>
      )}
      <TimeSeriesChart
        className={className}
        selectedLocale={selectedLocale}
        data={rewardsData}
        yAxisOrientation="right"
        margin={CHART_STYLES.margin}
        padding={CHART_STYLES.padding}
        series={series}
        tickFormatY={tickFormatY}
        renderTooltip={renderTooltip}
        onTooltipContext={setTooltipContext}
        onZoom={onZoomSnap}
        slotEmpty={slotEmpty}
        defaultZoomDomain={defaultZoomDomain}
        minZoomDomain={TRADING_REWARDS_TIME_RESOLUTION * 2}
        numGridLines={0}
        tickSpacingX={210}
        tickSpacingY={50}
      >
        {rewardsData.length > 0 && (
          <$Value>
            {MustBigNumber(
              tooltipContext?.tooltipData?.nearestDatum?.datum?.cumulativeAmount ??
                totalTradingRewards
            ).toFixed(TOKEN_DECIMALS)}
            <AssetIcon symbol={chainTokenLabel} />
          </$Value>
        )}
      </TimeSeriesChart>
    </>
  );
};

const $TitleContainer = styled.div`
  ${layoutMixins.spacedRow}
  width: 100%;

  font: var(--font-medium-book);
`;

const $Title = styled.span`
  color: var(--color-text-1);
  height: min-content;
`;

const $Value = styled.div`
  place-self: start;
  isolation: isolate;

  color: var(--color-text-2);
  font: var(--font-large-book);

  ${layoutMixins.inlineRow}
  flex-basis: 100%;
`;
