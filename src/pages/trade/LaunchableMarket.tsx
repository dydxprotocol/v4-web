import { useMemo, useRef, useState } from 'react';

import { useMatch } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { TradeLayouts } from '@/constants/layout';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { AccountInfo } from '@/views/AccountInfo';
import { LaunchMarketSidePanel } from '@/views/LaunchMarketSidePanel';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedTradeLayout } from '@/state/layoutSelectors';

import { getDisplayableTickerFromMarket } from '@/lib/assetUtils';

import { HorizontalPanel } from './HorizontalPanel';
import { InnerPanel } from './InnerPanel';
import { MarketSelectorAndStats } from './MarketSelectorAndStats';
import { MobileBottomPanel } from './MobileBottomPanel';
import { MobileTopPanel } from './MobileTopPanel';
import { TradeDialogTrigger } from './TradeDialogTrigger';
import { TradeHeaderMobile } from './TradeHeaderMobile';

const LaunchableMarket = () => {
  const tradePageRef = useRef<HTMLDivElement>(null);
  const { isTablet } = useBreakpoints();
  const tradeLayout = useAppSelector(getSelectedTradeLayout);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const match = useMatch(`/${AppRoute.Trade}/:marketId`);
  const { marketId } = match?.params ?? {};

  const displayableTicker = useMemo(() => {
    return getDisplayableTickerFromMarket(marketId ?? '');
  }, [marketId]);

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
        <MarketSelectorAndStats launchableMarketId={displayableTicker} />
      </header>

      <$GridSection gridArea="Side" tw="grid-rows-[auto_minmax(0,1fr)]">
        <AccountInfo />
        <$LaunchMarketSidePanel launchableMarketId={displayableTicker} />
      </$GridSection>

      <$GridSection gridArea="Inner">
        <InnerPanel isViewingUnlaunchedMarket />
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

const $LaunchMarketSidePanel = styled(LaunchMarketSidePanel)`
  border-top: var(--border-width) solid var(--color-border);
`;
