import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { curveLinear } from '@visx/curve';
import { TooltipContextType } from '@visx/xychart';
import axios from 'axios';
import { debounce } from 'lodash';
import styled from 'styled-components';

import { IDateStats } from '@/constants/affiliates';
import {
  AffiliatesProgramDatum,
  AffiliatesProgramMetric,
  AffiliatesProgramPeriod,
  affiliatesProgramPeriods,
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
import { OutputType, formatNumberOutput } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

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

export const ProgramHistoricalChart = ({
  selectedChartMetric,
  selectedLocale,
  slotEmpty,
  className,
}: ElementProps & StyleProps & { selectedChartMetric: AffiliatesProgramMetric }) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const historyStartDate = '2024-01-01T00:00:00Z';
  const now = useNow({ intervalMs: timeUnits.minute });

  const [periodOptions, setPeriodOptions] = useState<AffiliatesProgramPeriod[]>([
    AffiliatesProgramPeriod.PeriodAllTime,
  ]);
  const [tooltipContext, setTooltipContext] =
    useState<TooltipContextType<AffiliatesProgramDatum>>();
  const [isZooming, setIsZooming] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AffiliatesProgramPeriod>(
    AffiliatesProgramPeriod.PeriodAllTime
  );
  const [defaultZoomDomain, setDefaultZoomDomain] = useState<number | undefined>(undefined);
  const [metricData, setMetricData] = useState<{ date: number; cumulativeAmount: number }[]>([]);

  const chartTitles = {
    [AffiliatesProgramMetric.AffiliateEarnings]: stringGetter({
      key: STRING_KEYS.AFFILIATE_EARNINGS,
    }),
    [AffiliatesProgramMetric.ReferredTrades]: stringGetter({ key: STRING_KEYS.TRADES_REFERRED }),
    [AffiliatesProgramMetric.ReferredUsers]: stringGetter({ key: STRING_KEYS.USERS_REFERRED }),
    [AffiliatesProgramMetric.ReferredVolume]: stringGetter({ key: STRING_KEYS.VOLUME_REFERRED }),
  };

  useEffect(() => {
    fetchMetricData();
  }, [selectedChartMetric, selectedPeriod]);

  const getStartDate = (): string => {
    const currentTime = new Date();

    switch (selectedPeriod) {
      case AffiliatesProgramPeriod.Period1d:
        return new Date(currentTime.setDate(currentTime.getDate() - 1)).toISOString();
      case AffiliatesProgramPeriod.Period7d:
        return new Date(currentTime.setDate(currentTime.getDate() - 7)).toISOString();
      case AffiliatesProgramPeriod.Period30d:
        return new Date(currentTime.setMonth(currentTime.getMonth() - 1)).toISOString();
      case AffiliatesProgramPeriod.Period90d:
        return new Date(currentTime.setMonth(currentTime.getMonth() - 3)).toISOString();
      case AffiliatesProgramPeriod.PeriodAllTime:
        return new Date(0).toISOString(); // The earliest possible date
      default:
        throw new Error('Invalid rolling window value');
    }
  };

  const fetchMetricData = async () => {
    const { data } = await axios.get(
      `http://localhost:3000/v1/community/chart-metrics?start_date=${getStartDate()}&end_date=${new Date().toISOString()}`
    );

    const periodData: IDateStats[] = data;

    setMetricData(
      periodData
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((m) => ({
          date: new Date(m.date).getTime(),
          cumulativeAmount: Number(m[selectedChartMetric]),
        }))
    );
  };

  const oldestDataPointDate = metricData?.[0]?.date;
  const newestDataPointDate = metricData?.[metricData.length - 1]?.date;

  const msForPeriod = useCallback(
    (period: AffiliatesProgramPeriod, clampMax: Boolean = true) => {
      const earliestDatum = oldestDataPointDate ?? Number(historyStartDate);
      const latestDatum = newestDataPointDate ?? now;
      const maxPeriod = latestDatum - earliestDatum;

      switch (period) {
        case AffiliatesProgramPeriod.Period1d:
          return clampMax ? Math.min(maxPeriod, 1 * timeUnits.day) : 1 * timeUnits.day;
        case AffiliatesProgramPeriod.Period7d:
          return clampMax ? Math.min(maxPeriod, 7 * timeUnits.day) : 7 * timeUnits.day;
        case AffiliatesProgramPeriod.Period30d:
          return clampMax ? Math.min(maxPeriod, 30 * timeUnits.day) : 30 * timeUnits.day;
        case AffiliatesProgramPeriod.Period90d:
          return clampMax ? Math.min(maxPeriod, 90 * timeUnits.day) : 90 * timeUnits.day;
        case AffiliatesProgramPeriod.PeriodAllTime:
        default:
          return maxPeriod;
      }
    },
    [now, historyStartDate, newestDataPointDate, oldestDataPointDate]
  );

  // Include period option only if oldest date is older it
  // e.g. oldest date is 31 days old -> show 30d option, but not 90d
  const getPeriodOptions = useCallback(
    (oldestMs: number): AffiliatesProgramPeriod[] =>
      affiliatesProgramPeriods.reduce((acc: AffiliatesProgramPeriod[], period) => {
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
        dataKey: 'affiliate-program',
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
    return periodOptions.map((period: AffiliatesProgramPeriod) => ({
      value: period,
      label:
        period === AffiliatesProgramPeriod.PeriodAllTime
          ? stringGetter({ key: STRING_KEYS.ALL })
          : // TODO: Remove this type assertion, msForPeriod function is only acepting TradingRewardsPeriod type as argument
            formatRelativeTime(msForPeriod(period, false), {
              locale: selectedLocale,
              relativeToTimestamp: 0,
              largestUnit: 'day',
            }),
    }));
  }, [stringGetter, msForPeriod, selectedLocale, periodOptions]);

  const setTradingRewardsPeriod = useCallback((value: string) => {
    setSelectedPeriod(value as AffiliatesProgramPeriod);
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
