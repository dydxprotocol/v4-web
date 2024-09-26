import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { curveLinear } from '@visx/curve';
import { TooltipContextType } from '@visx/xychart';
import { debounce } from 'lodash';
import styled from 'styled-components';

import {
  AffiliatesProgramDatum,
  TradingRewardsPeriod,
  tradingRewardsPeriods,
  type TradingRewardsDatum,
} from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { OutputType, formatNumberOutput } from '@/components/Output';
import { Tabs } from '@/components/Tabs';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { formatRelativeTime } from '@/lib/dateTime';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  selectedLocale: string;
  slotEmpty: React.ReactNode;
};

type StyleProps = {
  className?: string;
};

const PROGRAM_DATA_TIME_RESOLUTION = 1 * timeUnits.hour;

const CHART_STYLES = {
  margin: { left: 32, right: 48, top: 12, bottom: 32 },
  padding: {
    left: 0.01,
    right: 0.01,
    top: 0.5,
    bottom: 0.01,
  },
};

enum ChartMetric {
  ReferredVolume = 'referred_volume',
  AffiliatePayouts = 'affiliate_payouts',
  ReferredUsers = 'referred_users',
  ReferredTrades = 'referred_trades',
}

export const ProgramHistoryChart = ({
  selectedChartMetric,
  selectedLocale,
  slotEmpty,
  className,
}: ElementProps & StyleProps & { selectedChartMetric: ChartMetric }) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const historyStartDate = '2024-06-01T00:00:00Z';
  const now = useNow({ intervalMs: timeUnits.minute });

  const [periodOptions, setPeriodOptions] = useState<TradingRewardsPeriod[]>([
    TradingRewardsPeriod.PeriodAllTime,
  ]);
  const [tooltipContext, setTooltipContext] =
    useState<TooltipContextType<AffiliatesProgramDatum>>();
  const [isZooming, setIsZooming] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TradingRewardsPeriod>(
    TradingRewardsPeriod.PeriodAllTime
  );
  const [defaultZoomDomain, setDefaultZoomDomain] = useState<number | undefined>(undefined);
  const [metricData, setMetricData] = useState<{ date: number; cumulativeAmount: number }[]>([]);

  const chartTitles = {
    [ChartMetric.AffiliatePayouts]: 'Affiliate payouts',
    [ChartMetric.ReferredTrades]: 'Referred trades',
    [ChartMetric.ReferredUsers]: 'Referred users',
    [ChartMetric.ReferredVolume]: 'Referred volume',
  };

  useEffect(() => {
    fetchMetricData();
  }, [selectedChartMetric]);

  const fetchMetricData = async () => {
    // Call to backend here

    const mockMetricData = [
      {
        date: new Date('2024-09-01T00:00:00Z').valueOf(),
        cumulativeAmount: 800,
      },

      {
        date: new Date('2024-08-01T00:00:00Z').valueOf(),
        cumulativeAmount: 3000,
      },
      {
        date: new Date('2024-07-01T00:00:00Z').valueOf(),
        cumulativeAmount: 0,
      },
      {
        date: new Date('2024-07-02T00:00:00Z').valueOf(),
        cumulativeAmount: 100,
      },
      {
        date: new Date('2024-07-03T00:00:00Z').valueOf(),
        cumulativeAmount: 200,
      },
      {
        date: new Date('2024-09-04T00:00:00Z').valueOf(),
        cumulativeAmount: 300,
      },
      {
        date: new Date('2024-07-19T00:00:00Z').valueOf(),
        cumulativeAmount: 400,
      },
      {
        date: new Date('2024-07-29T00:00:00Z').valueOf(),
        cumulativeAmount: 500,
      },
      {
        date: new Date('2024-08-07T00:00:00Z').valueOf(),
        cumulativeAmount: 600,
      },
      {
        date: new Date('2024-08-13T00:00:00Z').valueOf(),
        cumulativeAmount: 700,
      },
      {
        date: new Date('2024-08-20T00:00:00Z').valueOf(),
        cumulativeAmount: 800,
      },
      {
        date: new Date('2024-08-30T00:00:00Z').valueOf(),
        cumulativeAmount: 900,
      },
      {
        date: new Date('2024-07-30T00:00:00Z').valueOf(),
        cumulativeAmount: 1000,
      },
      {
        date: new Date('2024-07-10T00:00:00Z').valueOf(),
        cumulativeAmount: 1100,
      },
      {
        date: new Date('2024-09-13T00:00:00Z').valueOf(),
        cumulativeAmount: 1200,
      },
      {
        date: new Date('2024-09-25T00:00:00Z').valueOf(),
        cumulativeAmount: 1300,
      },
    ];
    setMetricData(mockMetricData.sort((a, b) => a.date - b.date));
  };

  const oldestDataPointDate = metricData?.[0]?.date;
  const newestDataPointDate = metricData?.[metricData.length - 1]?.date;

  const msForPeriod = useCallback(
    (period: TradingRewardsPeriod, clampMax: Boolean = true) => {
      const earliestDatum = oldestDataPointDate ?? Number(historyStartDate);
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
    [now, historyStartDate, newestDataPointDate, oldestDataPointDate]
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

  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const tickFormatY = useCallback(
    (value: number) =>
      formatNumberOutput(value, OutputType.CompactNumber, {
        decimalSeparator,
        groupSeparator,
        selectedLocale,
      }),
    [decimalSeparator, groupSeparator, selectedLocale]
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
      {metricData.length === 0 ? undefined : (
        <div tw="spacedRow w-full font-medium-book">
          <span tw="h-min text-color-text-1">{chartTitles[selectedChartMetric]}</span>

          <ToggleGroup
            items={toggleGroupItems}
            value={isZooming ? '' : selectedPeriod}
            onValueChange={setTradingRewardsPeriod}
            onInteraction={onToggleInteract}
          />
        </div>
      )}
      <TimeSeriesChart
        className={className}
        selectedLocale={selectedLocale}
        data={metricData}
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
        minZoomDomain={PROGRAM_DATA_TIME_RESOLUTION * 2}
        numGridLines={0}
        tickSpacingX={210}
        tickSpacingY={50}
      >
        {metricData.length > 0 && (
          <$Value>
            {MustBigNumber(
              tooltipContext?.tooltipData?.nearestDatum?.datum?.cumulativeAmount ?? 1000
            ).toFixed(TOKEN_DECIMALS)}
            <AssetIcon symbol={chainTokenLabel} />
          </$Value>
        )}
      </TimeSeriesChart>
    </>
  );
};
const $Value = styled.div`
  place-self: start;
  isolation: isolate;

  color: var(--color-text-2);
  font: var(--font-large-book);

  ${layoutMixins.inlineRow}
  flex-basis: 100%;
`;

export const CommunityChart = () => {
  const [chartMetric, setChartMetric] = useState(ChartMetric.ReferredVolume);
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);

  return (
    <div className="notTablet:px-1">
      <Tabs
        value={chartMetric}
        onValueChange={setChartMetric}
        items={[
          {
            value: ChartMetric.ReferredVolume,
            label: stringGetter({ key: STRING_KEYS.VOLUME_REFERRED }),
          },
          {
            value: ChartMetric.AffiliatePayouts,
            label: stringGetter({ key: STRING_KEYS.AFFILIATE_PAYOUTS }),
          },
          {
            value: ChartMetric.ReferredUsers,
            label: stringGetter({ key: STRING_KEYS.USERS_REFERRED }),
          },
          {
            value: ChartMetric.ReferredTrades,
            label: stringGetter({ key: STRING_KEYS.TRADES_REFERRED }),
          },
        ]}
      />

      <$ChartContainer className="bg-color-layer-3 p-2">
        <ProgramHistoryChart
          selectedChartMetric={chartMetric}
          selectedLocale={selectedLocale}
          slotEmpty={
            <div tw="grid cursor-default">
              <$EmptyCard>
                <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
                {stringGetter({
                  key: STRING_KEYS.TRADING_REWARD_CHART_EMPTY_STATE,
                })}
              </$EmptyCard>
            </div>
          }
          tw="h-20 [--trading-rewards-line-color:--color-positive]"
        />
      </$ChartContainer>
    </div>
  );
};

const $ChartContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
`;

const $EmptyCard = styled.div`
  width: 16.75rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto;
  gap: 1rem;

  font: var(--font-base-book);
  color: var(--color-text-0);
`;
