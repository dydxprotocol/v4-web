import { useEffect, useRef } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent, css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { LARGE_TOKEN_DECIMALS, TINY_PERCENT_DECIMALS } from '@/constants/numbers';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { NextFundingTimer } from '@/views/NextFundingTimer';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import {
  getCurrentMarketConfig,
  getCurrentMarketData,
  getCurrentMarketMidMarketPrice,
} from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';

import { MidMarketPrice } from './MidMarketPrice';

type ElementProps = {
  showMidMarketPrice?: boolean;
};

enum MarketStats {
  OraclePrice = 'OraclePrice',
  PriceChange24H = 'PriceChange24H',
  OpenInterest = 'OpenInterest',
  Funding1H = 'Funding1H',
  Volume24H = 'Volume24H',
  Trades24H = 'Trades24H',
  NextFunding = 'NextFunding',
}

const defaultMarketStatistics = Object.values(MarketStats);

export const MarketStatsDetails = ({ showMidMarketPrice = true }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { id = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { tickSizeDecimals } = useSelector(getCurrentMarketConfig, shallowEqual) ?? {};
  const midMarketPrice = useSelector(getCurrentMarketMidMarketPrice);
  const lastMidMarketPrice = useRef(midMarketPrice);
  const currentMarketData = useSelector(getCurrentMarketData, shallowEqual);
  const isLoading = currentMarketData === undefined;

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
  };

  const labelMap = {
    [MarketStats.OraclePrice]: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
    [MarketStats.NextFunding]: stringGetter({ key: STRING_KEYS.NEXT_FUNDING }),
    [MarketStats.Funding1H]: stringGetter({ key: STRING_KEYS.FUNDING_RATE_1H_SHORT }),
    [MarketStats.OpenInterest]: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
    [MarketStats.PriceChange24H]: stringGetter({ key: STRING_KEYS.CHANGE_24H }),
    [MarketStats.Trades24H]: stringGetter({ key: STRING_KEYS.TRADES_24H }),
    [MarketStats.Volume24H]: stringGetter({ key: STRING_KEYS.VOLUME_24H }),
  };

  return (
    <Styled.MarketDetailsItems>
      {showMidMarketPrice && (
        <Styled.MidMarketPrice>
          <MidMarketPrice />
          <VerticalSeparator />
        </Styled.MidMarketPrice>
      )}

      <Styled.Details
        items={defaultMarketStatistics.map((stat) => ({
          key: stat,
          label: labelMap[stat],
          tooltip: stat,
          // value: <output>{valueMap[stat]?.toString()}</output>,
          value: (() => {
            const value = valueMap[stat];
            const valueBN = MustBigNumber(value);

            const color = valueBN.isNegative() ? 'var(--color-negative)' : 'var(--color-positive)';

            switch (stat) {
              case MarketStats.OraclePrice: {
                return (
                  <Styled.Output
                    type={OutputType.Fiat}
                    value={value}
                    fractionDigits={tickSizeDecimals}
                  />
                );
              }
              case MarketStats.OpenInterest: {
                return (
                  <Styled.Output
                    type={OutputType.Number}
                    value={value}
                    tag={id}
                    fractionDigits={LARGE_TOKEN_DECIMALS}
                  />
                );
              }
              case MarketStats.Funding1H: {
                return (
                  <Styled.Output
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
                  <Styled.RowSpan color={!isLoading ? color : undefined}>
                    {!isLoading && <TriangleIndicator value={valueBN} />}
                    <Styled.Output
                      type={OutputType.Fiat}
                      value={valueBN.abs()}
                      fractionDigits={tickSizeDecimals}
                    />
                    {!isLoading && (
                      <Styled.Output
                        type={OutputType.Percent}
                        value={MustBigNumber(priceChange24HPercent).abs()}
                        withParentheses
                      />
                    )}
                  </Styled.RowSpan>
                );
              }
              case MarketStats.Trades24H: {
                return <Styled.Output type={OutputType.Number} value={value} fractionDigits={0} />;
              }
              case MarketStats.Volume24H: {
                // $ with no decimals
                return <Styled.Output type={OutputType.Fiat} value={value} fractionDigits={0} />;
              }
              default: {
                // Default renderer
                return <Styled.Output type={OutputType.Text} value={value} />;
              }
            }
          })(),
        }))}
        isLoading={isLoading}
        layout={isTablet ? 'grid' : 'rowColumns'}
        withSeparators={!isTablet}
      />
    </Styled.MarketDetailsItems>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketDetailsItems = styled.div`
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

Styled.Details = styled(Details)`
  font: var(--font-mini-book);

  @media ${breakpoints.tablet} {
    ${layoutMixins.withOuterAndInnerBorders}

    font: var(--font-small-book);

    > * {
      padding: 0.625rem 1rem;
    }
  }
`;

Styled.MidMarketPrice = styled.div`
  ${layoutMixins.sticky}
  ${layoutMixins.row}
  font: var(--font-medium-medium);

  background-color: var(--color-layer-2);
  box-shadow: 0.25rem 0 0.75rem var(--color-layer-2);
  padding-left: 1rem;
  gap: 1rem;
`;

Styled.Output = styled(Output)<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}
`;

Styled.RowSpan = styled.span<{ color?: string }>`
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
