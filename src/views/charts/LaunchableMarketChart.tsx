import { useCallback, useMemo, useState } from 'react';

import { curveLinear } from '@visx/curve';
import { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import styled from 'styled-components';
import tw from 'twin.macro';

import { MetadataServiceCandlesTimeframes } from '@/constants/assetMetadata';
import { ButtonSize } from '@/constants/buttons';
import { TradingViewBar } from '@/constants/candles';
import { STRING_KEYS } from '@/constants/localization';
import { LIQUIDITY_TIERS } from '@/constants/markets';
import { timeUnits } from '@/constants/time';
import { TooltipStringKeys } from '@/constants/tooltips';

import {
  useMetadataServiceAssetFromId,
  useMetadataServiceCandles,
} from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';

import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TimeSeriesChart } from '@/components/visx/TimeSeriesChart';

import { useAppSelector } from '@/state/appTypes';
import { getChartDotBackground } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { BIG_NUMBERS } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

const ISOLATED_LIQUIDITY_TIER_INFO = LIQUIDITY_TIERS[4];

export const LaunchableMarketChart = ({
  className,
  ticker,
}: {
  className?: string;
  ticker?: string;
}) => {
  const stringGetter = useStringGetter();
  const [timeframe, setTimeframe] = useState<MetadataServiceCandlesTimeframes>('1d');
  const launchableAsset = useMetadataServiceAssetFromId(ticker);
  const { id, marketCap, name, price, logo, reportedMarketCap, tickSizeDecimals, urls } =
    orEmptyObj(launchableAsset);
  const cmcLink = urls?.cmc ?? undefined;
  const candlesQuery = useMetadataServiceCandles(id, timeframe);
  const selectedLocale = useAppSelector(getSelectedLocale);
  const chartDotsBackground = useAppSelector(getChartDotBackground);
  const showSelfReportedMarketCap = marketCap ? false : !!reportedMarketCap;

  const items = [
    {
      key: 'market-cap',
      label: (
        <span tw="flex items-center gap-0.25">
          {stringGetter({ key: STRING_KEYS.MARKET_CAP })}
          {showSelfReportedMarketCap && <Icon iconName={IconName.CautionCircle} />}
        </span>
      ),
      value: (
        <Output
          type={OutputType.CompactFiat}
          isLoading={!ticker}
          tw="text-color-text-1"
          value={showSelfReportedMarketCap ? reportedMarketCap : marketCap}
        />
      ),
      tooltip: showSelfReportedMarketCap ? ('self-reported-cmc' as TooltipStringKeys) : undefined,
    },
    {
      key: 'max-leverage',
      label: stringGetter({ key: STRING_KEYS.MAXIMUM_LEVERAGE }),
      value: (
        <Output
          type={OutputType.Multiple}
          isLoading={!ticker}
          value={
            ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction
              ? BIG_NUMBERS.ONE.div(ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction)
              : null
          }
        />
      ),
    },
  ];

  const xAccessorFunc = useCallback((datum: TradingViewBar) => datum.time, []);
  const yAccessorFunc = useCallback((datum: TradingViewBar) => datum.close, []);

  const colorString = useMemo(() => {
    if (!candlesQuery.data) return 'var(--color-text-1)';
    const first = candlesQuery.data[0];
    const last = candlesQuery.data[candlesQuery.data.length - 1];
    if (first.close > last.close) return 'var(--color-negative)';
    return 'var(--color-positive)';
  }, [candlesQuery.data]);

  const series = useMemo(
    () => [
      {
        dataKey: 'pnl',
        xAccessor: xAccessorFunc,
        yAccessor: yAccessorFunc,
        colorAccessor: () => colorString,
        getCurve: () => curveLinear,
        threshold: {
          aboveAreaProps: {
            fill: 'var(--color-text-0)',
            fillOpacity: 0.2,
            stroke: colorString,
          },
          // This yAccessor displays a gradient from the line to the bottom (0) of the chart.
          yAccessor: () => 0,
        },
      },
    ],
    [colorString, xAccessorFunc, yAccessorFunc]
  );

  const renderTooltip = (tooltipParam: RenderTooltipParams<TradingViewBar>) => {
    const datum = tooltipParam?.tooltipData?.nearestDatum?.datum;
    if (!datum) return <div />;

    return (
      <div tw="flex flex-col gap-0.5 rounded-[0.5rem] bg-color-layer-7 p-0.5">
        <Output tw="inline" value={datum.time} type={OutputType.DateTime} />
        <span>
          {stringGetter({ key: STRING_KEYS.PRICE })}:{' '}
          <Output
            tw="inline"
            value={datum.close}
            type={OutputType.Fiat}
            fractionDigits={tickSizeDecimals}
          />
        </span>
      </div>
    );
  };

  return (
    <$LaunchableMarketChartContainer className={className}>
      <$ChartContainerHeader tw="flex flex-row items-center justify-between">
        <div tw="mr-0.5 flex flex-row items-center gap-0.5">
          {logo ? (
            <img tw="h-2.5 w-2.5 rounded-[50%]" src={logo} alt={name} />
          ) : (
            <div tw="h-2.5 w-2.5 rounded-[50%] bg-color-layer-5" />
          )}
          <h2 tw="flex flex-row items-center gap-[0.5ch] text-extra text-color-text-1">
            {name && (
              <Link href={cmcLink}>
                <span>{name}</span>
                {cmcLink && <LinkOutIcon tw="h-1.25 w-1.25" />}
              </Link>
            )}
          </h2>
        </div>

        {id && <Tag>{getDisplayableAssetFromBaseAsset(id)}</Tag>}
      </$ChartContainerHeader>

      <div tw="flex flex-row justify-between">
        <$Details
          layout="rowColumns"
          items={[
            {
              key: 'reference-price',
              label: stringGetter({ key: STRING_KEYS.REFERENCE_PRICE }),
              tooltip: 'reference-price',
              value: (
                <Output
                  type={OutputType.Fiat}
                  tw="text-color-text-1"
                  value={price}
                  isLoading={!ticker}
                  fractionDigits={tickSizeDecimals}
                />
              ),
            },
          ]}
        />
        <$ToggleGroup
          size={ButtonSize.Base}
          items={[
            {
              value: '1d',
              label: `1${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`,
            },
            {
              value: '7d',
              label: `7${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`,
            },
            {
              value: '30d',
              label: `30${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`,
            },
          ]}
          value={timeframe}
          onValueChange={setTimeframe}
        />
      </div>

      <$ChartContainer chartBackground={chartDotsBackground}>
        {!ticker ? null : candlesQuery.isLoading || !candlesQuery.data ? (
          <LoadingSpace id="launchable-market-chart" />
        ) : (
          <TimeSeriesChart
            selectedLocale={selectedLocale}
            data={candlesQuery.data}
            series={series}
            margin={{
              left: -0.5,
              right: -0.5,
              top: 0,
              bottom: -0.5,
            }}
            padding={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
            minZoomDomain={timeUnits.month}
            slotEmpty={undefined}
            numGridLines={0}
            tickSpacingX={210}
            tickSpacingY={75}
            renderTooltip={renderTooltip}
          />
        )}
      </$ChartContainer>

      <$Details layout="rowColumns" items={items} />
    </$LaunchableMarketChartContainer>
  );
};

const $LaunchableMarketChartContainer = tw.div`flex h-fit w-[25rem] flex-col gap-1 rounded-[1rem] border-[length:--border-width] border-color-border p-1.5 [border-style:solid]`;

const $ChartContainerHeader = tw.div`flex flex-row items-center justify-between`;

const $Details = styled(Details)`
  & > div {
    &:first-of-type {
      padding-left: 0;
    }
  }
`;

const $ToggleGroup = styled(ToggleGroup)`
  button {
    --button-backgroundColor: transparent;
    --button-border: none;

    &[data-state='on'],
    &[data-state='active'] {
      --button-backgroundColor: transparent;
      --button-border: none;
    }

    &:last-of-type {
      padding-right: 0;
    }
  }
` as typeof ToggleGroup;

const $ChartContainer = styled.div<{ chartBackground?: string }>`
  ${tw`h-[8.75rem] overflow-hidden rounded-[1rem] border-[length:--border-width] border-color-border [border-style:solid]`}
  background: url(${({ chartBackground }) => chartBackground}) no-repeat center;
  background-size: 175%;
`;
