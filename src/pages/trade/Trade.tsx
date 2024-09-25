import { useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { TradeLayouts } from '@/constants/layout';

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
import { getSelectedTradeLayout } from '@/state/layoutSelectors';

import { testFlags } from '@/lib/testFlags';

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
  const tradeLayout = useAppSelector(getSelectedTradeLayout);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const [isHorizontalPanelOpen, setIsHorizontalPanelOpen] = useState(true);

  usePageTitlePriceUpdates();
  useTradeFormInputs();

  if (isViewingUnlaunchedMarket && testFlags.pml) {
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
        <TradeBox />
      </$GridSection>

      <$GridSection gridArea="Vertical">
        <VerticalPanel tradeLayout={tradeLayout} />
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
  tradeLayout: TradeLayouts;
  isHorizontalPanelOpen: boolean;
}>`
  --horizontalPanel-height: 18rem;

  // Constants
  /* prettier-ignore */
  --layout-default:
    'Top Top Top' auto
    'Inner Vertical Side' minmax(0, 1fr)
    'Horizontal Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / 1fr minmax(0, var(--orderbook-trades-width)) var(--sidebar-width);

  /* prettier-ignore */
  --layout-default-desktopMedium:
    'Top Vertical Side' auto
    'Inner Vertical Side' minmax(0, 1fr)
    'Horizontal Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / 1fr minmax(0, var(--orderbook-trades-width)) var(--sidebar-width);

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
