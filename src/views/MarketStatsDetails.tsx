import { useEffect, useRef } from 'react';

import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { LARGE_TOKEN_DECIMALS, TINY_PERCENT_DECIMALS } from '@/constants/numbers';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { WithTooltip } from '@/components/WithTooltip';
import { NextFundingTimer } from '@/views/NextFundingTimer';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import {
  getCurrentMarketConfig,
  getCurrentMarketData,
  getCurrentMarketMidMarketPrice,
} from '@/state/perpetualsSelectors';

import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';

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

const defaultMarketStatistics = [
  MarketStats.OraclePrice,
  MarketStats.PriceChange24H,
  MarketStats.OpenInterest,
  MarketStats.Funding1H,
  MarketStats.Volume24H,
  MarketStats.Trades24H,
  MarketStats.NextFunding,
  MarketStats.MaxLeverage,
];

export const MarketStatsDetails = ({ showMidMarketPrice = true }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { id = '' } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { tickSizeDecimals, initialMarginFraction, effectiveInitialMarginFraction } =
    useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};
  const midMarketPrice = useAppSelector(getCurrentMarketMidMarketPrice);
  const lastMidMarketPrice = useRef(midMarketPrice);
  const currentMarketData = useAppSelector(getCurrentMarketData, shallowEqual);
  const isLoading = currentMarketData === undefined;

  const { uiRefresh } = testFlags;

  const { oraclePrice, perpetual, priceChange24H, priceChange24HPercent } = currentMarketData ?? {};

  useEffect(() => {
    lastMidMarketPrice.current = midMarketPrice;
  }, [midMarketPrice]);

  const { nextFundingRate, openInterest, trades24H, volume24H } = perpetual ?? {};

  const valueMap = {
    [MarketStats.OraclePrice]: oraclePrice,
    [MarketStats.NextFunding]: undefined, // hardcoded
    [MarketStats.Funding1H]: nextFundingRate,
    [MarketStats.OpenInterest]: openInterest,
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
        items={(uiRefresh ? Object.values(MarketStats) : defaultMarketStatistics).map((stat) => ({
          key: stat,
          label: labelMap[stat],
          tooltip: stat,
          value: (
            <DetailsItem
              value={valueMap[stat]}
              stat={stat}
              tickSizeDecimals={tickSizeDecimals}
              id={id}
              isLoading={isLoading}
              priceChange24HPercent={priceChange24HPercent}
              initialMarginFraction={initialMarginFraction}
              effectiveInitialMarginFraction={effectiveInitialMarginFraction}
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
  id,
  isLoading,
  priceChange24HPercent,
  initialMarginFraction,
  effectiveInitialMarginFraction,
}: {
  value: number | null | undefined;
  stat: MarketStats;
  tickSizeDecimals: number | null | undefined;
  id: string;
  isLoading: boolean;
  priceChange24HPercent: number | null | undefined;
  initialMarginFraction: number | null | undefined;
  effectiveInitialMarginFraction: number | null | undefined;
}) => {
  const valueBN = MustBigNumber(value);

  const color = valueBN.isNegative() ? 'var(--color-negative)' : 'var(--color-positive)';

  switch (stat) {
    case MarketStats.OraclePrice: {
      return <$Output type={OutputType.Fiat} value={value} fractionDigits={tickSizeDecimals} />;
    }
    case MarketStats.OpenInterest: {
      return (
        <$Output
          type={OutputType.Number}
          value={value}
          tag={id}
          fractionDigits={LARGE_TOKEN_DECIMALS}
        />
      );
    }
    case MarketStats.Funding1H: {
      return (
        <$Output
          type={OutputType.Percent}
          value={value}
          color={color}
          fractionDigits={TINY_PERCENT_DECIMALS}
        />
      );
    }
    case MarketStats.NextFunding: {
      return <NextFundingTimer />;
    }
    case MarketStats.PriceChange24H: {
      return (
        <$RowSpan color={!isLoading ? color : undefined}>
          {!isLoading && <TriangleIndicator value={valueBN} />}
          <$Output type={OutputType.Fiat} value={valueBN.abs()} fractionDigits={tickSizeDecimals} />
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
          withDiff={initialMarginFraction !== effectiveInitialMarginFraction}
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
