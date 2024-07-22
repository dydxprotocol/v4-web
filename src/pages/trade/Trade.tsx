import { useRef, useState } from 'react';

import styled from 'styled-components';

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
          <$TradeLayout ref={tradePageRef} isHorizontalPanelOpen={isHorizontalPanelOpen}>
            {!isDesktopMedium && top}
            <$MainSection gridArea="Main">
              <$TestSection>
                {orderbookTradePanel}
                {tradingChart}
              </$TestSection>
              {horizontalPane}
            </$MainSection>
            {sidebar}
          </$TradeLayout>
        );
      case TradeLayouts.Reverse:
        return (
          <$TradeLayout ref={tradePageRef} isHorizontalPanelOpen={isHorizontalPanelOpen}>
            {!isDesktopMedium && top}
            <$MainSection gridArea="Main">
              <$TestSection>
                {tradingChart}
                {orderbookTradePanel}
              </$TestSection>
              {horizontalPane}
            </$MainSection>
            {sidebar}
          </$TradeLayout>
        );
      case TradeLayouts.Default:
      default:
        return (
          <$TradeLayout ref={tradePageRef} isHorizontalPanelOpen={isHorizontalPanelOpen}>
            {!isDesktopMedium && top}
            {sidebar}
            <$MainSection gridArea="Main">
              <$TestSection>
                {orderbookTradePanel}
                {tradingChart}
              </$TestSection>
              {horizontalPane}
            </$MainSection>
          </$TradeLayout>
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
    desktopLayout()
  );
  // <$TradeLayout ref={tradePageRef} isHorizontalPanelOpen={isHorizontalPanelOpen}>
  /* </$TradeLayout> */
};

export default TradePage;
const $TradeLayout = styled.article<{
  isHorizontalPanelOpen: boolean;
}>`
  // Rules
  width: 0;
  min-width: 100%;
  height: 0;
  min-height: 100%;

  display: flex;
  flex-wrap: wrap;

  ${layoutMixins.withOuterAndInnerBorders};
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
  box-shadow: none;
`;

const $GridSection = styled.section<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};
`;

const $SideSection = styled($GridSection)`
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  display: flex;
  flex-direction: column;

  height: calc(100% - var(--market-info-row-height));

  @media ${breakpoints.desktopMedium} {
    height: 100%;
  }
`;

const $MainSection = styled($GridSection)`
  display: flex;
  flex-direction: column;
  height: calc(100% - var(--market-info-row-height));

  @media ${breakpoints.desktopMedium} {
    height: 100%;
  }

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
  display: flex;
  flex-direction: column;
`;

const $HorizontalSection = styled.div`
  overflow: hidden;
  width: 100%;
  display: grid;
`;

const $TradeBox = styled(TradeBox)`
  overflow-y: auto;
  height: 100%;
  padding-top: var(--border-width);
`;
