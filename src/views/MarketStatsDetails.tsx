import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { FUNDING_DECIMALS, LARGE_TOKEN_DECIMALS } from '@/constants/numbers';
import { TooltipStringKeys } from '@/constants/tooltips';
import { DisplayUnit } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { DisplayUnitTag } from '@/components/DisplayUnitTag';
import { Output, OutputType } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { WithTooltip } from '@/components/WithTooltip';
import { NextFundingTimer } from '@/views/NextFundingTimer';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';

import { BIG_NUMBERS, MaybeBigNumber, MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { MidMarketPrice } from './MidMarketPrice';

type ElementProps = {
  showMidMarketPrice?: boolean;
};

enum MarketStats {
  OraclePrice = 'OraclePrice',
  PriceChange24H = 'PriceChange24H',
  Volume24H = 'Volume24H',
  Trades24H = 'Trades24H',
  OpenInterest = 'OpenInterest',
  Funding1H = 'Funding1H',
  NextFunding = 'NextFunding',
  MaxLeverage = 'MaxLeverage',
}

export const MarketStatsDetails = ({ showMidMarketPrice = true }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const marketData = useAppSelector(BonsaiHelpers.currentMarket.marketInfo);
  const loadingState = useAppSelector(BonsaiCore.markets.markets.loading);
  const isLoading = marketData == null && loadingState === 'pending';

  const {
    displayableAsset,
    effectiveInitialMarginFraction,
    initialMarginFraction,
    nextFundingRate,
    openInterest,
    openInterestUSDC,
    oraclePrice,
    percentChange24h,
    priceChange24H,
    tickSizeDecimals,
    trades24H,
    volume24H,
  } = orEmptyObj(marketData);

  const displayUnit = useAppSelector(getSelectedDisplayUnit);

  const valueMap = {
    [MarketStats.OraclePrice]: oraclePrice,
    [MarketStats.NextFunding]: undefined, // hardcoded
    [MarketStats.Funding1H]: nextFundingRate,
    [MarketStats.OpenInterest]: displayUnit === DisplayUnit.Fiat ? openInterestUSDC : openInterest,
    [MarketStats.PriceChange24H]: priceChange24H,
    [MarketStats.Trades24H]: trades24H,
    [MarketStats.Volume24H]: volume24H,
    [MarketStats.MaxLeverage]: undefined, // needs more complex logic
  };

  const labelMap = {
    [MarketStats.OraclePrice]: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
    [MarketStats.NextFunding]: stringGetter({ key: STRING_KEYS.NEXT_FUNDING }),
    [MarketStats.Funding1H]: stringGetter({ key: STRING_KEYS.FUNDING_RATE_1H_SHORT }),
    [MarketStats.OpenInterest]: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
    [MarketStats.PriceChange24H]: stringGetter({ key: STRING_KEYS.CHANGE_24H }),
    [MarketStats.Trades24H]: stringGetter({ key: STRING_KEYS.TRADES_24H }),
    [MarketStats.Volume24H]: stringGetter({ key: STRING_KEYS.VOLUME_24H }),
    [MarketStats.MaxLeverage]: (
      <WithTooltip tooltip="maximum-leverage">
        {stringGetter({ key: STRING_KEYS.MAXIMUM_LEVERAGE })}
      </WithTooltip>
    ),
  };

  return (
    <$MarketDetailsItems>
      {showMidMarketPrice && (
        <$MidMarketPrice>
          <MidMarketPrice />
          <VerticalSeparator />
        </$MidMarketPrice>
      )}

      <$Details
        items={Object.values(MarketStats).map((stat) => ({
          key: stat,
          label: labelMap[stat],
          tooltip: stat as unknown as TooltipStringKeys, // just force for now, component will handle non-existing ones
          value: (
            <DetailsItem
              value={valueMap[stat]}
              stat={stat}
              tickSizeDecimals={tickSizeDecimals}
              assetId={displayableAsset ?? ''}
              isLoading={isLoading}
              priceChange24HPercent={percentChange24h}
              initialMarginFraction={initialMarginFraction}
              effectiveInitialMarginFraction={effectiveInitialMarginFraction}
              useFiatDisplayUnit={displayUnit === DisplayUnit.Fiat}
            />
          ),
        }))}
        isLoading={isLoading}
        layout={isTablet ? 'grid' : 'rowColumns'}
        withSeparators={!isTablet}
      />
    </$MarketDetailsItems>
  );
};
const $MarketDetailsItems = styled.div`
  @media ${breakpoints.notTablet} {
    ${layoutMixins.scrollArea}
    ${layoutMixins.row}
    isolation: isolate;

    align-items: stretch;
    margin-left: 1px;
  }

  @media ${breakpoints.tablet} {
    border-bottom: solid var(--border-width) var(--color-border);
  }
`;

const $Details = styled(Details)`
  font: var(--font-mini-book);

  @media ${breakpoints.tablet} {
    ${layoutMixins.withOuterAndInnerBorders}

    font: var(--font-small-book);

    > * {
      padding: 0.625rem 1rem;
    }
  }
`;

const $MidMarketPrice = styled.div`
  ${layoutMixins.sticky}
  ${layoutMixins.row}
  font: var(--font-medium-medium);

  background-color: var(--color-layer-2);
  box-shadow: 0.25rem 0 0.75rem var(--color-layer-2);
  padding-left: 1rem;
  gap: 1rem;
`;

const $Output = styled(Output)<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}
`;

const $RowSpan = styled.span<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}

  > span {
    ${layoutMixins.row}
  }

  gap: 0.25rem;
`;

const DetailsItem = ({
  value,
  stat,
  tickSizeDecimals,
  assetId,
  isLoading,
  priceChange24HPercent,
  initialMarginFraction,
  effectiveInitialMarginFraction,
  useFiatDisplayUnit,
}: {
  value: string | number | null | undefined;
  stat: MarketStats;
  tickSizeDecimals: number | null | undefined;
  assetId: string;
  isLoading: boolean;
  priceChange24HPercent: number | null | undefined;
  initialMarginFraction: string | null | undefined;
  effectiveInitialMarginFraction: number | null | undefined;
  useFiatDisplayUnit: boolean;
}) => {
  const valueBN = MustBigNumber(value);
  const stringGetter = useStringGetter();

  const color = valueBN.isNegative() ? 'var(--color-negative)' : 'var(--color-positive)';

  switch (stat) {
    case MarketStats.OraclePrice: {
      return (
        <$Output
          withSubscript
          type={OutputType.Fiat}
          value={value}
          fractionDigits={tickSizeDecimals}
        />
      );
    }
    case MarketStats.OpenInterest: {
      return (
        <$Output
          type={OutputType.Number}
          value={value}
          fractionDigits={useFiatDisplayUnit ? 0 : LARGE_TOKEN_DECIMALS}
          slotRight={
            <DisplayUnitTag tw="ml-[0.5ch]" assetId={assetId} entryPoint="openInterestAssetTag" />
          }
        />
      );
    }
    case MarketStats.Funding1H: {
      return (
        <WithTooltip
          slotTooltip={
            <dl>
              <dd tw="flex">
                {stringGetter({ key: STRING_KEYS.ANNUALIZED })}:
                <Output
                  tw="ml-0.25"
                  type={OutputType.Percent}
                  value={MustBigNumber(value).times(24 * 365)}
                  fractionDigits={0}
                />
              </dd>
            </dl>
          }
        >
          <$Output
            type={OutputType.Percent}
            value={value}
            color={!isLoading ? color : undefined}
            fractionDigits={FUNDING_DECIMALS}
          />
        </WithTooltip>
      );
    }
    case MarketStats.NextFunding: {
      return <NextFundingTimer />;
    }
    case MarketStats.PriceChange24H: {
      return (
        <$RowSpan color={!isLoading ? color : undefined}>
          {!isLoading && <TriangleIndicator value={valueBN} />}
          <$Output
            withSubscript
            type={OutputType.Fiat}
            value={valueBN.abs()}
            fractionDigits={tickSizeDecimals}
          />
          {!isLoading && (
            <$Output
              type={OutputType.Percent}
              value={MustBigNumber(priceChange24HPercent).abs()}
              withParentheses
            />
          )}
        </$RowSpan>
      );
    }
    case MarketStats.Trades24H: {
      return <$Output type={OutputType.Number} value={value} fractionDigits={0} />;
    }
    case MarketStats.Volume24H: {
      // $ with no decimals
      return <$Output type={OutputType.Fiat} value={value} fractionDigits={0} />;
    }
    case MarketStats.MaxLeverage: {
      return (
        <DiffOutput
          value={initialMarginFraction ? BIG_NUMBERS.ONE.div(initialMarginFraction) : null}
          newValue={
            effectiveInitialMarginFraction
              ? BIG_NUMBERS.ONE.div(effectiveInitialMarginFraction)
              : null
          }
          withDiff={
            MaybeBigNumber(initialMarginFraction)?.toNumber() !==
            (effectiveInitialMarginFraction ?? undefined)
          }
          type={OutputType.Multiple}
        />
      );
    }
    default: {
      // Default renderer
      return <$Output type={OutputType.Text} value={value} />;
    }
  }
};
