import { useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';
import { usePageTitlePriceUpdates } from '@/hooks/usePageTitlePriceUpdates';
import { useTradeFormInputs } from '@/hooks/useTradeFormInputs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { AccountInfo } from '@/views/AccountInfo';
import { TradeBox } from '@/views/TradeBox';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { HorizontalPanel } from './HorizontalPanel';
import { InnerPanel } from './InnerPanel';
import LaunchableMarket from './LaunchableMarket';
import { MarketSelectorAndStats } from './MarketSelectorAndStats';
import { MobileBottomPanel } from './MobileBottomPanel';
import { MobileTopPanel } from './MobileTopPanel';
import { TradeDialogTrigger } from './TradeDialogTrigger';
import { TradeHeaderMobile } from './TradeHeaderMobile';
import { VerticalPanel } from './VerticalPanel';

const TradePage = () => {
  const tradePageRef = useRef<HTMLDivElement>(null);

  const { isViewingUnlaunchedMarket } = useCurrentMarketId();
  const { isTablet } = useBreakpoints();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const [isHorizontalPanelOpen, setIsHorizontalPanelOpen] = useState(true);

  usePageTitlePriceUpdates();
  useTradeFormInputs();

  if (isViewingUnlaunchedMarket) {
    return <LaunchableMarket />;
  }

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
    <$TradeLayout ref={tradePageRef} isHorizontalPanelOpen={isHorizontalPanelOpen}>
      <header tw="[grid-area:Top]">
        <MarketSelectorAndStats />
      </header>

      <$GridSection gridArea="Side" tw="grid-rows-[auto_minmax(0,1fr)]">
        <AccountInfo />
        <TradeBox />
      </$GridSection>

      <$GridSection gridArea="Vertical">
        <VerticalPanel />
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

export default TradePage;
const $TradeLayout = styled.article<{
  isHorizontalPanelOpen: boolean;
}>`
  --horizontalPanel-height: 18rem;

  // Constants
  /* prettier-ignore */
  --layout-default:
    'Top Top Top' auto
    'Side Vertical Inner' minmax(0, 1fr)
    'Side Horizontal Horizontal' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / var(--sidebar-width) minmax(0, var(--orderbook-trades-width)) 1fr;

  /* prettier-ignore */
  --layout-default-desktopMedium:
    'Side Vertical Top' auto
    'Side Vertical Inner' minmax(0, 1fr)
    'Side Horizontal Horizontal' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / var(--sidebar-width) minmax(0, var(--orderbook-trades-width)) 1fr;

  /* prettier-ignore */
  --layout-alternative:
    'Top Top Top' auto
    'Vertical Inner Side' minmax(0, 1fr)
    'Horizontal Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / minmax(0, var(--orderbook-trades-width)) 1fr var(--sidebar-width);

  /* prettier-ignore */
  --layout-alternative-desktopMedium:
    'Vertical Top Side' auto
    'Vertical Inner Side' minmax(0, 1fr)
    'Horizontal Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / minmax(0, var(--orderbook-trades-width)) 1fr var(--sidebar-width);

  // Props/defaults

  --layout: var(--layout-default);

  // Variants
  @media ${breakpoints.desktopMedium} {
    --layout: var(--layout-default-desktopMedium);
  }

  direction: rtl;

  > * {
    direction: initial;
  }

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
