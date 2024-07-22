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

  const header = (
    <$Header>
      <MarketSelectorAndStats />
    </$Header>
  );

  // Depending on the screensize, we either render the market selector header as a header across the whole page, or just as a header to the markets chart
  const maybePageHeader = !isDesktopMedium && header;
  const maybeChartSectionHeader = isDesktopMedium && header;

  const sidebar = (
    <$ParentSection>
      <AccountInfo />
      <$TradeBox />
    </$ParentSection>
  );
  const tradeSection = (
    <$TradeSection>
      <VerticalPanel tradeLayout={tradeLayout} />
    </$TradeSection>
  );
  const chartSection = (
    <$ChartSection>
      {maybeChartSectionHeader}
      <InnerPanel />
    </$ChartSection>
  );
  const horizontalSection = (
    <$HorizontalSection>
      <HorizontalPanel isOpen={isHorizontalPanelOpen} setIsOpen={setIsHorizontalPanelOpen} />
    </$HorizontalSection>
  );

  const desktopLayout = () => {
    switch (tradeLayout) {
      case TradeLayouts.Alternative:
        return (
          <>
            <$MainSection>
              <$BorderedContainer>
                {tradeSection}
                {chartSection}
              </$BorderedContainer>
              {horizontalSection}
            </$MainSection>
            {sidebar}
          </>
        );
      case TradeLayouts.Reverse:
        return (
          <>
            <$MainSection>
              <$BorderedContainer>
                {chartSection}
                {tradeSection}
              </$BorderedContainer>
              {horizontalSection}
            </$MainSection>
            {sidebar}
          </>
        );
      case TradeLayouts.Default:
      default:
        return (
          <>
            {sidebar}
            <$MainSection>
              <$BorderedContainer>
                {tradeSection}
                {chartSection}
              </$BorderedContainer>
              {horizontalSection}
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
    <$TradeLayoutDesktop ref={tradePageRef}>
      <>
        {maybePageHeader} {desktopLayout()}
      </>
    </$TradeLayoutDesktop>
  );
};

export default TradePage;

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

const $TradeLayoutDesktop = styled.article`
  width: 0;
  min-width: 100%;
  height: 0;
  min-height: 100%;

  display: flex;
  flex-wrap: wrap;

  ${layoutMixins.withOuterAndInnerBorders};
`;

const $Header = styled.header`
  box-shadow: none;
`;

const $ParentSection = styled.section`
  display: flex;
  flex-direction: column;

  height: calc(100% - var(--market-info-row-height));

  @media ${breakpoints.desktopMedium} {
    height: 100%;
  }
`;

const $MainSection = styled($ParentSection)`
  flex: 1 1 1px;

  ${layoutMixins.withOuterAndInnerBorders};
`;

const $TradeSection = styled.section`
  width: var(--orderbook-trades-width);
`;

const $ChartSection = styled.section`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
`;

const $HorizontalSection = styled.section`
  overflow: auto;
`;

const $BorderedContainer = styled.div`
  display: flex;
  flex-grow: 1;

  ${layoutMixins.withOuterAndInnerBorders};
`;

const $TradeBox = styled(TradeBox)`
  height: 100%;
  overflow-y: auto;
  padding-top: var(--border-width);
`;
