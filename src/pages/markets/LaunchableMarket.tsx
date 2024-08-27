import { useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { TradeLayouts } from '@/constants/layout';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { AccountInfo } from '@/views/AccountInfo';
import { LaunchMarketSidePanel } from '@/views/LaunchMarketSidePanel';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedTradeLayout } from '@/state/layoutSelectors';

import { HorizontalPanel } from '../trade/HorizontalPanel';
import { InnerPanel } from '../trade/InnerPanel';
import { MarketSelectorAndStats } from '../trade/MarketSelectorAndStats';
import { MobileBottomPanel } from '../trade/MobileBottomPanel';
import { MobileTopPanel } from '../trade/MobileTopPanel';
import { TradeDialogTrigger } from '../trade/TradeDialogTrigger';
import { TradeHeaderMobile } from '../trade/TradeHeaderMobile';

const LaunchableMarket = () => {
  const tradePageRef = useRef<HTMLDivElement>(null);
  const { isTablet } = useBreakpoints();
  const tradeLayout = useAppSelector(getSelectedTradeLayout);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const [isHorizontalPanelOpen, setIsHorizontalPanelOpen] = useState(true);

  return isTablet ? (
    <$TradeLayoutMobile>
      <TradeHeaderMobile />

      <div>
        <DetachedSection>
          <MobileTopPanel />
        </DetachedSection>

        <DetachedSection>
          <HorizontalPanel />
        </DetachedSection>

        <DetachedSection>
          <MobileBottomPanel />
        </DetachedSection>
      </div>

      {canAccountTrade && <TradeDialogTrigger />}
    </$TradeLayoutMobile>
  ) : (
    <$TradeLayout
      ref={tradePageRef}
      tradeLayout={tradeLayout}
      isHorizontalPanelOpen={isHorizontalPanelOpen}
    >
      <header tw="[grid-area:Top]">
        <MarketSelectorAndStats />
      </header>

      <$GridSection gridArea="Side" tw="grid-rows-[auto_minmax(0,1fr)]">
        <AccountInfo />
        <LaunchMarketSidePanel />
      </$GridSection>

      <$GridSection gridArea="Inner">
        <InnerPanel />
      </$GridSection>

      <$GridSection gridArea="Horizontal">
        <HorizontalPanel isOpen={isHorizontalPanelOpen} setIsOpen={setIsHorizontalPanelOpen} />
      </$GridSection>
    </$TradeLayout>
  );
};

export default LaunchableMarket;

const $TradeLayout = styled.article<{
  tradeLayout: TradeLayouts;
  isHorizontalPanelOpen: boolean;
}>`
  --horizontalPanel-height: 18rem;

  // Constants
  /* prettier-ignore */
  --layout-default:
    'Top Top' auto
    'Side Inner' minmax(0, 1fr)
    'Side Horizontal' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / var(--sidebar-width) 1fr;

  /* prettier-ignore */
  --layout-default-desktopMedium:
    'Side Top' auto
    'Side Inner' minmax(0, 1fr)
    'Side Horizontal' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / var(--sidebar-width) 1fr;

  /* prettier-ignore */
  --layout-alternative:
    'Top Top' auto
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / 1fr var(--sidebar-width);

  /* prettier-ignore */
  --layout-alternative-desktopMedium:
    'Top Side' auto
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
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
      [TradeLayouts.Alternative]: css`
        --layout: var(--layout-alternative);
        @media ${breakpoints.desktopMedium} {
          --layout: var(--layout-alternative-desktopMedium);
        }
      `,
      [TradeLayouts.Reverse]: css`
        direction: rtl;

        > * {
          direction: initial;
        }
      `,
    })[tradeLayout]}

  ${({ isHorizontalPanelOpen }) =>
    !isHorizontalPanelOpen &&
    css`
      --horizontalPanel-height: auto !important;
    `}

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
    display: grid;
  }

  > section {
    contain: strict;
  }
`;

const $TradeLayoutMobile = styled.article`
  ${layoutMixins.contentContainerPage}
  min-height: 100%;

  ${layoutMixins.stickyArea1}
  --stickyArea1-topHeight: var(--page-header-height-mobile);
  --stickyArea1-bottomHeight: var(--page-footer-height-mobile);

  ${layoutMixins.withInnerHorizontalBorders}

  > div:nth-child(2) {
    flex: 1;

    ${layoutMixins.flexColumn}
    justify-content: start;
  }
`;
const $GridSection = styled.section<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};
`;
