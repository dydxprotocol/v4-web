import { useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { TradeLayouts } from '@/constants/layout';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { SpotTvChart } from '@/views/charts/TradingView/SpotTvChart';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedTradeLayout } from '@/state/layoutSelectors';

const SpotPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const tradeLayout = useAppSelector(getSelectedTradeLayout);

  return (
    <$SpotLayout tradeLayout={tradeLayout}>
      <header tw="[grid-area:Top]">
        <div tw="p-1">Spot Market Selector (Coming Soon)</div>
      </header>

      <$GridSection gridArea="Side">
        <div tw="p-1">Spot Side Panel (Coming Soon)</div>
      </$GridSection>

      <$GridSection gridArea="Inner">
        <SpotTvChart symbol={symbol!} />
      </$GridSection>

      <$GridSection gridArea="Horizontal">
        <div tw="p-1">Spot Horizontal Panel (Coming Soon)</div>
      </$GridSection>
    </$SpotLayout>
  );
};

export default SpotPage;

const $SpotLayout = styled.article<{
  tradeLayout: TradeLayouts;
}>`
  /* prettier-ignore */
  --layout-default: 
    'Top Top' auto 
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' 200px
    / 1fr var(--sidebar-width);

  /* prettier-ignore */
  --layout-default-desktopMedium:
    'Top Side' auto
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' 200px
    / 1fr var(--sidebar-width);

  // Props/defaults
  --layout: var(--layout-default);

  // Variants
  @media ${breakpoints.desktopMedium} {
    --layout: var(--layout-default-desktopMedium);
  }

  ${({ tradeLayout }) =>
    ({
      [TradeLayouts.Default]: null,
      [TradeLayouts.Reverse]: css`
        direction: rtl;
        > * {
          direction: initial;
        }
      `,
    })[tradeLayout]}

  // Rules
  width: 0;
  min-width: 100%;
  height: 0;
  min-height: 100%;

  display: grid;
  grid-template: var(--layout);

  ${layoutMixins.withOuterAndInnerBorders}

  @media (prefers-reduced-motion: no-preference) {
    transition: grid-template 0.2s var(--ease-out-expo);
  }

  > * {
    display: flex;
    flex-direction: column;
  }

  > section {
    contain: strict;
  }
`;

const $GridSection = styled.section<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};
`;
