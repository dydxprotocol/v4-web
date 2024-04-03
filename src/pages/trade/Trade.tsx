import { useRef, useState } from 'react';

import { useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { PanelView, InfoSection } from '@/constants/horizontalPanel';
import { TradeLayouts } from '@/constants/layout';

import {
  useBreakpoints,
  useCurrentMarketId,
  usePageTitlePriceUpdates,
  useTradeFormInputs,
} from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { AccountInfo } from '@/views/AccountInfo';
import { TradeBox } from '@/views/TradeBox';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configsSelectors';
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
  const tradeLayout = useSelector(getSelectedTradeLayout);
  const canAccountTrade = useSelector(calculateCanAccountTrade);

  const [isHorizontalPanelOpen, setIsHorizontalPanelOpen] = useState(true);
  const allMarkets = useSelector(getDefaultToAllMarketsInPositionsOrdersFills);
  const [view, setView] = useState<PanelView>(
    allMarkets ? PanelView.AllMarkets : PanelView.CurrentMarket
  );
  const [tab, setTab] = useState<InfoSection>(InfoSection.Position);

  usePageTitlePriceUpdates();
  useTradeFormInputs();

  return isTablet ? (
    <Styled.TradeLayoutMobile>
      <TradeHeaderMobile />

      <div>
        <DetachedSection>
          <MobileTopPanel />
        </DetachedSection>

        <DetachedSection>
          <HorizontalPanel tab={tab} view={view} setTab={setTab} setView={setView} />
        </DetachedSection>

        <DetachedSection>
          <MobileBottomPanel />
        </DetachedSection>
      </div>

      {canAccountTrade && <TradeDialogTrigger />}
    </Styled.TradeLayoutMobile>
  ) : (
    <Styled.TradeLayout
      ref={tradePageRef}
      tradeLayout={tradeLayout}
      isHorizontalPanelOpen={isHorizontalPanelOpen}
    >
      <Styled.Top>
        <MarketSelectorAndStats />
      </Styled.Top>

      <Styled.SideSection gridArea="Side">
        <AccountInfo />
        <TradeBox setTab={setTab} setView={setView} />
      </Styled.SideSection>

      <Styled.GridSection gridArea="Vertical">
        <VerticalPanel tradeLayout={tradeLayout} />
      </Styled.GridSection>

      <Styled.GridSection gridArea="Inner">
        <InnerPanel />
      </Styled.GridSection>

      <Styled.GridSection gridArea="Horizontal">
        <HorizontalPanel
          tab={tab}
          view={view}
          setTab={setTab}
          setView={setView}
          isOpen={isHorizontalPanelOpen}
          setIsOpen={setIsHorizontalPanelOpen}
        />
      </Styled.GridSection>
    </Styled.TradeLayout>
  );
};

export default TradePage;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TradeLayout = styled.article<{
  tradeLayout: TradeLayouts;
  isHorizontalPanelOpen: boolean;
}>`
  --horizontalPanel-height: 20.625rem;

  // Constants
  /* prettier-ignore */
  --layout-default:
    'Top Top Top' auto
    'Side Vertical Inner' minmax(0, 1fr)
    'Side Horizontal Horizontal' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / var(--sidebar-width) minmax(0, var(--orderbook-trades-width)) 1fr;

  /* prettier-ignore */
  --layout-default-desktopMedium:
    'Top Top Top' auto
    'Side Vertical Inner' minmax(0, 1fr)
    'Side Vertical Horizontal' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / var(--sidebar-width) minmax(0, var(--orderbook-trades-width)) 1fr;

  /* prettier-ignore */
  --layout-default-desktopLarge:
    'Top Top Top' auto
    'Side Vertical Inner' minmax(0, 1fr)
    'Side Vertical Horizontal' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / var(--sidebar-width) minmax(0, var(--orderbook-trades-width)) 1fr;

  /* prettier-ignore */
  --layout-alternative:
    'Top Top Top' auto
    'Vertical Inner Side' minmax(0, 1fr)
    'Horizontal Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / minmax(0, var(--orderbook-trades-width)) 1fr var(--sidebar-width);

  /* prettier-ignore */
  --layout-alternative-desktopMedium:
    'Top Top Top' auto
    'Vertical Inner Side' minmax(0, 1fr)
    'Vertical Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / minmax(0, var(--orderbook-trades-width)) 1fr var(--sidebar-width);

  /* prettier-ignore */
  --layout-alternative-desktopLarge:
    'Top Top Top' auto
    'Vertical Inner Side' minmax(0, 1fr)
    'Vertical Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / minmax(0, var(--orderbook-trades-width)) 1fr var(--sidebar-width);

  // Props/defaults

  --layout: var(--layout-default);

  // Variants

  @media ${breakpoints.desktopMedium} {
    --layout: var(--layout-default-desktopMedium);
  }

  @media ${breakpoints.desktopLarge} {
    --horizontalPanel-height: 23.75rem;
    --layout: var(--layout-default-desktopLarge);
  }

  ${({ tradeLayout }) =>
    ({
      [TradeLayouts.Default]: null,
      [TradeLayouts.Alternative]: css`
        --layout: var(--layout-alternative);

        @media ${breakpoints.desktopMedium} {
          --layout: var(--layout-alternative-desktopMedium);
        }
        @media ${breakpoints.desktopLarge} {
          --layout: var(--layout-alternative-desktopLarge);
        }
      `,
      [TradeLayouts.Reverse]: css`
        direction: rtl;

        > * {
          direction: initial;
        }
      `,
    }[tradeLayout])}

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

Styled.TradeLayoutMobile = styled.article`
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

Styled.Top = styled.header`
  grid-area: Top;
`;

Styled.GridSection = styled.section<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};
`;

Styled.SideSection = styled(Styled.GridSection)`
  grid-template-rows: auto minmax(0, 1fr);
`;
