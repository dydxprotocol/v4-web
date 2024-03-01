import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType } from '@/components/Output';

import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

type ExchangeBillboardsProps = {
  isSearching: boolean;
  searchQuery: string;
  className?: string;
};

export const ExchangeBillboards: React.FC<ExchangeBillboardsProps> = ({
  isSearching,
  searchQuery,
  className,
}) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  let volume24HUSDC = 0;
  let totalTrades24H = 0;
  let openInterestUSDC = 0;

  const perpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) ?? {};

  Object.values(perpetualMarkets)
    .filter(Boolean)
    .forEach(({ oraclePrice, perpetual }) => {
      const { volume24H, trades24H, openInterest = 0 } = perpetual || {};
      volume24HUSDC += volume24H ?? 0;
      totalTrades24H += trades24H ?? 0;
      if (oraclePrice) openInterestUSDC += openInterest * oraclePrice;
    });

  return (
    <Styled.MarketBillboardsWrapper className={className}>
      {[
        {
          key: 'volume',
          labelKey: isTablet ? STRING_KEYS.VOLUME_24H : STRING_KEYS.TRADING_VOLUME,
          value: volume24HUSDC || undefined,
          fractionDigits: 0,
          type: isTablet ? OutputType.CompactFiat : OutputType.Fiat,
          subLabelKey: !isTablet && STRING_KEYS.TRADING_VOLUME_LABEL,
        },
        {
          key: 'open-interest',
          labelKey: STRING_KEYS.OPEN_INTEREST,
          value: openInterestUSDC || undefined,
          fractionDigits: 0,
          type: isTablet ? OutputType.CompactFiat : OutputType.Fiat,
          subLabelKey: !isTablet && STRING_KEYS.OPEN_INTEREST_LABEL,
        },
        {
          key: 'trades',
          labelKey: isTablet ? STRING_KEYS.TRADES_24H : STRING_KEYS.TRADES,
          value: totalTrades24H || undefined,
          type: isTablet ? OutputType.CompactNumber : OutputType.Number,
          subLabelKey: !isTablet && STRING_KEYS.TRADES_LABEL,
        },
      ].map(({ key, labelKey, value, fractionDigits, type, subLabelKey }) => (
        <Styled.BillboardContainer key={key}>
          <label>{stringGetter({ key: labelKey })}</label>
          <Styled.Output
            useGrouping
            fractionDigits={fractionDigits}
            type={type}
            value={value}
            withBaseFont
          />
          {subLabelKey && <p>{stringGetter({ key: subLabelKey })}</p>}
        </Styled.BillboardContainer>
      ))}
    </Styled.MarketBillboardsWrapper>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketBillboardsWrapper = styled.div`
  ${layoutMixins.row}

  gap: 1.75rem;

  padding: 1rem;

  @media ${breakpoints.tablet} {
    gap: 0.625rem;

    padding: 0 1rem;
  }
`;

Styled.BillboardContainer = styled.div`
  ${layoutMixins.rowColumn}
  width: 17.5rem;

  label {
    margin-bottom: 1rem;
  }

  p {
    margin-top: 0.25rem;
  }

  label,
  p {
    font: var(--font-base-book);
    color: var(--color-text-0);
  }

  &:not(:last-child) {
    border-right: solid var(--border-width) var(--color-border);
  }

  @media ${breakpoints.tablet} {
    padding: 0.625rem 0.75rem;

    background-color: var(--color-layer-3);
    border-radius: 0.625rem;

    &:not(:last-child) {
      border-right: none;
    }

    label {
      margin-bottom: 0.5rem;
      color: var(--color-text-1);

      font: var(--font-mini-book);
    }
  }
`;

Styled.Output = styled(Output)`
  font: var(--font-extra-book);
  color: var(--color-text-2);

  @media ${breakpoints.tablet} {
    font: var(--font-base-book);
  }
`;
