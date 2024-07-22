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

import { HorizontalPanel } from './HorizontalPanel';
import { InnerPanel } from './InnerPanel';
import { MarketSelectorAndStats } from './MarketSelectorAndStats';
import { MobileBottomPanel } from './MobileBottomPanel';
import { MobileTopPanel } from './MobileTopPanel';
import { TradeDialogTrigger } from './TradeDialogTrigger';
import { TradeHeaderMobile } from './TradeHeaderMobile';
import { VerticalPanel } from './VerticalPanel';

const TradePage = () => {
  const tradePageRef = useRef<HTMLDivElement>(null);

  useCurrentMarketId();
  const { isTablet } = useBreakpoints();
  const tradeLayout = useAppSelector(getSelectedTradeLayout);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const { isDesktopMedium } = useBreakpoints();

  const [isHorizontalPanelOpen, setIsHorizontalPanelOpen] = useState(true);

  usePageTitlePriceUpdates();
  useTradeFormInputs();

  const desktopLayout = () => {
    const top = (
      <$Top>
        <MarketSelectorAndStats />
      </$Top>
    );
    const sidebar = (
      <$SideSection gridArea="Side">
        <AccountInfo />
        <$TradeBox />
      </$SideSection>
    );
    const orderbookTradePanel = (
      <$TradeSection>
        <VerticalPanel tradeLayout={tradeLayout} />
      </$TradeSection>
    );
    const tradingChart = (
      <$InnerSection>
        {isDesktopMedium && top}
        <InnerPanel />
      </$InnerSection>
    );
    const horizontalPane = (
      <$HorizontalSection>
        <HorizontalPanel isOpen={isHorizontalPanelOpen} setIsOpen={setIsHorizontalPanelOpen} />
      </$HorizontalSection>
    );
    switch (tradeLayout) {
      case TradeLayouts.Alternative:
        return (
          <>
            {!isDesktopMedium && top}
            <$MainSection gridArea="Main">
              <$TestSection>
                {orderbookTradePanel}
                {tradingChart}
              </$TestSection>
              {horizontalPane}
            </$MainSection>
            {sidebar}
          </>
        );
      case TradeLayouts.Reverse:
        return (
          <>
            {!isDesktopMedium && top}
            <$MainSection gridArea="Main">
              <$TestSection>
                {tradingChart}
                {orderbookTradePanel}
              </$TestSection>
              {horizontalPane}
            </$MainSection>
            {sidebar}
          </>
        );
      case TradeLayouts.Default:
      default:
        return (
          <>
            {!isDesktopMedium && top}
            {sidebar}
            <$MainSection gridArea="Main">
              <$TestSection>
                {orderbookTradePanel}
                {tradingChart}
              </$TestSection>
              {horizontalPane}
            </$MainSection>
          </>
        );
    }
  };

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
      {desktopLayout()}
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

  // --layout: var(--layout-default);

  // Variants
  @media ${breakpoints.desktopMedium} {
    --layout: var(--layout-default-desktopMedium);
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

  display: flex;
  flex-wrap: wrap;

  ${layoutMixins.withOuterAndInnerBorders}; // @media (prefers-reduced-motion: no-preference) {
  //   transition: grid-template 0.2s var(--ease-out-expo);
  // }

  // > * {
  //   display: grid;
  // }

  // > section {
  //   contain: strict;
  // }
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

const $Top = styled.header`
  grid-area: Top;
`;

const $GridSection = styled.section<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};
`;

const $SideSection = styled($GridSection)`
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
`;

const $MainSection = styled($GridSection)`
  display: flex;
  flex-direction: column;
  // flex-wrap: wrap;
  height: 100%;
  // gap: var(--border-width);

  ${layoutMixins.withOuterAndInnerBorders};

  flex: 1 1 1px;
`;

const $TestSection = styled.div`
  display: flex;
  flex-grow: 1;
  ${layoutMixins.withOuterAndInnerBorders};
`;

const $TradeSection = styled.div`
  width: var(--orderbook-trades-width);
`;

const $InnerSection = styled.div`
  flex: 1;
`;

const $HorizontalSection = styled.div`
  overflow: hidden;
  width: 100%;
  height: calc(100% - var(--stickyArea-bottomHeight));
`;

const $TradeBox = styled(TradeBox)`
  height: calc(100% - var(--account-info-section-height) - var(--market-info-row-height));

  @media ${breakpoints.desktopMedium} {
    height: calc(100% - var(--account-info-section-height));
  }

  overflow-y: auto;
`;
