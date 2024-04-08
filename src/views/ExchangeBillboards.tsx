import { useMemo } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';

import { store } from '@/state/_store';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

type ExchangeBillboardsProps = {
  className?: string;
};

export const ExchangeBillboards: React.FC<ExchangeBillboardsProps> = ({ className }) => {
  const stringGetter = useStringGetter();

  const perpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) ?? {};

  const { volume24HUSDC, totalTrades24H, openInterestUSDC } = useMemo(() => {
    let volume24HUSDC = 0;
    let totalTrades24H = 0;
    let openInterestUSDC = 0;

    const markets = Object.values(perpetualMarkets).filter(Boolean);

    for (const { oraclePrice, perpetual } of markets) {
      const { volume24H, trades24H, openInterest = 0 } = perpetual || {};
      volume24HUSDC += volume24H ?? 0;
      totalTrades24H += trades24H ?? 0;
      if (oraclePrice) openInterestUSDC += openInterest * oraclePrice;
    }

    return {
      volume24HUSDC,
      totalTrades24H,
      openInterestUSDC,
    };
  }, [perpetualMarkets]);

  return (
    <Styled.MarketBillboardsWrapper className={className}>
      {[
        {
          key: 'volume',
          labelKey: STRING_KEYS.TRADING_VOLUME,
          tagKey: STRING_KEYS._24H,
          value: volume24HUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.CompactFiat,
        },
        {
          key: 'open-interest',
          labelKey: STRING_KEYS.OPEN_INTEREST,
          tagKey: STRING_KEYS.CURRENT,
          value: openInterestUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.CompactFiat,
        },
        {
          key: 'fee-earned-stakers',
          labelKey: STRING_KEYS.EARNED,
          tagKey: STRING_KEYS._24H,
          value: totalTrades24H || undefined,
          type: OutputType.CompactNumber,
        },
      ].map(({ key, labelKey, tagKey, value, fractionDigits, type }) => (
        <Styled.BillboardContainer key={key}>
          <Styled.BillboardStat>
            <Styled.BillboardTitle>
              <label>{stringGetter({ key: labelKey })}</label>
              <Tag>{stringGetter({ key: tagKey })}</Tag>
            </Styled.BillboardTitle>
            <Styled.Output
              useGrouping
              fractionDigits={fractionDigits}
              type={type}
              value={value}
              withBaseFont
            />
          </Styled.BillboardStat>
        </Styled.BillboardContainer>
      ))}
    </Styled.MarketBillboardsWrapper>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketBillboardsWrapper = styled.div`
  ${layoutMixins.column}

  gap: 1rem;
`;

Styled.BillboardContainer = styled.div`
  ${layoutMixins.rowColumn}
  flex: 1;
`;

Styled.BillboardTitle = styled.div`
  ${layoutMixins.row}

  gap: 0.375rem;
`;

Styled.BillboardStat = styled.div`
  ${layoutMixins.column}

  background-color: var(--color-layer-3);
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: 0.625rem;

  label {
    color: var(--color-text-0);
    font: var(--font-base-medium);
  }

  output {
    color: var(--color-text-1);
    font: var(--font-large-medium);
  }
`;

Styled.Output = styled(Output)`
  font: var(--font-extra-book);
  color: var(--color-text-2);

  @media ${breakpoints.tablet} {
    font: var(--font-base-book);
  }
`;
