import { useCallback } from 'react';

import styled from 'styled-components';

import { HORIZONTAL_PANEL_MAX_HEIGHT, HORIZONTAL_PANEL_MIN_HEIGHT } from '@/constants/layout';

import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';
import { usePageTitlePriceUpdates } from '@/hooks/usePageTitlePriceUpdates';

import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { MarketsMenuDialog } from '@/views/dialogs/MarketsDialog/MarketsDialog';
import { UserMenuDialog } from '@/views/dialogs/MobileUserMenuDialog';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setHorizontalPanelHeightPx } from '@/state/appUiConfigs';
import { getHorizontalPanelHeightPx } from '@/state/appUiConfigsSelectors';

import LaunchableMarket from '../LaunchableMarket';
import { MobileBottomPanel } from '../MobileBottomPanel';
import { MobileTopPanel } from '../MobileTopPanel';
import { useResizablePanel } from '../useResizablePanel';
import { TradeHeaderMobile } from './TradeHeader';

const TradePage = () => {
  const { isViewingUnlaunchedMarket } = useCurrentMarketId();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const horizontalPanelHeightPxBase = useAppSelector(getHorizontalPanelHeightPx);
  const dispatch = useAppDispatch();
  const setPanelHeight = useCallback(
    (h: number) => {
      dispatch(setHorizontalPanelHeightPx(h));
    },
    [dispatch]
  );
  const { handleMouseDown } = useResizablePanel(horizontalPanelHeightPxBase, setPanelHeight, {
    min: HORIZONTAL_PANEL_MIN_HEIGHT,
    max: HORIZONTAL_PANEL_MAX_HEIGHT,
  });

  usePageTitlePriceUpdates();

  if (isViewingUnlaunchedMarket) {
    return <LaunchableMarket />;
  }

  return (
    <$TradeLayoutMobile>
      <TradeHeaderMobile />

      <$MobileContent>
        <DetachedSection>
          <MobileTopPanel />
        </DetachedSection>

        <MobileBottomPanel />
      </$MobileContent>

      <UserMenuDialog />
      <MarketsMenuDialog />
    </$TradeLayoutMobile>
  );
};

export default TradePage;

const $TradeLayoutMobile = styled.div`
  ${layoutMixins.expandingColumnWithHeader}
  min-height: 100%;
`;

const $MobileContent = styled.article`
  ${layoutMixins.contentContainerPage}
`;
