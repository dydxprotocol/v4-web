import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AppRoute } from '@/constants/routes';
import { layoutMixins } from '@/styles/layoutMixins';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import { AssetIcon } from '@/components/AssetIcon';
import { BackButton } from '@/components/BackButton';
import { Output, OutputType } from '@/components/Output';

import { MustBigNumber } from '@/lib/numbers';

import { MidMarketPrice } from '@/views/MidMarketPrice';

export const TradeHeaderMobile = () => {
  const { name, id } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const navigate = useNavigate();

  const { market, priceChange24H, priceChange24HPercent } =
    useSelector(getCurrentMarketData, shallowEqual) ?? {};

  return (
    <Styled.Header>
      <BackButton onClick={() => navigate(AppRoute.Markets)} />
      <Styled.MarketName>
        <Styled.AssetIcon symbol={id} />
        <Styled.Name>
          <h3>{name}</h3>
          <span>{market}</span>
        </Styled.Name>
      </Styled.MarketName>

      <Styled.Right>
        <MidMarketPrice />
        <Styled.PriceChange
          type={OutputType.Percent}
          value={MustBigNumber(priceChange24HPercent).abs()}
          isNegative={MustBigNumber(priceChange24H).isNegative()}
        />
      </Styled.Right>
    </Styled.Header>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Header = styled.header`
  ${layoutMixins.contentSectionDetachedScrollable}

  ${layoutMixins.stickyHeader}
  z-index: 2;

  ${layoutMixins.row}

  padding-left: 1rem;
  padding-right: 1.5rem;
  gap: 1rem;

  color: var(--color-text-2);
  background-color: var(--color-layer-2);
`;

Styled.MarketName = styled.div`
  ${layoutMixins.inlineRow}
  gap: 1ch;
`;

Styled.AssetIcon = styled(AssetIcon)`
  font-size: 2.5rem;
`;

Styled.Name = styled.div`
  ${layoutMixins.rowColumn}

  h3 {
    font: var(--font-large-medium);
  }

  > :nth-child(2) {
    font: var(--font-mini-book);
    color: var(--color-text-0);
  }
`;

Styled.Right = styled.div`
  margin-left: auto;

  ${layoutMixins.rowColumn}
  justify-items: flex-end;
`;

Styled.PriceChange = styled(Output)<{ isNegative?: boolean }>`
  font: var(--font-small-book);
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
`;
