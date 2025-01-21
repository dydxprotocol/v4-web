import { useCallback, useMemo, useState } from 'react';

import { BonsaiCore } from '@/abacus-ts/ontology';
import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useShouldShowTriggers } from '@/hooks/useShouldShowTriggers';
import { useStringGetter } from '@/hooks/useStringGetter';

import { CollapsibleTabs } from '@/components/CollapsibleTabs';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { MobileTabs } from '@/components/Tabs';
import { Tag, TagType } from '@/components/Tag';
import { PositionInfo } from '@/views/PositionInfo';
import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { OrdersTable, OrdersTableColumnKey } from '@/views/tables/OrdersTable';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import {
  calculateIsAccountViewOnly,
  calculateShouldRenderActionsInPositionsTable,
} from '@/state/accountCalculators';
import {
  getCurrentMarketTradeInfoNumbers,
  getHasUnseenFillUpdates,
  getHasUnseenOrderUpdates,
  getTradeInfoNumbers,
} from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/appUiConfigsSelectors';
import { getHasUncommittedOrders } from '@/state/localOrdersSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { shortenNumberForDisplay } from '@/lib/numbers';

import { TradeTableSettings } from './TradeTableSettings';
import { MaybeUnopenedIsolatedPositionsDrawer } from './UnopenedIsolatedPositions';
import { MarketTypeFilter, PanelView } from './types';

enum InfoSection {
  Position = 'Position',
  Orders = 'Orders',
  Fills = 'Fills',
  Payments = 'Payments',
}

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  handleStartResize?: (e: React.MouseEvent<HTMLElement>) => void;
};

export const HorizontalPanel = ({ isOpen = true, setIsOpen, handleStartResize }: ElementProps) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { isTablet } = useBreakpoints();

  const allMarkets = useAppSelector(getDefaultToAllMarketsInPositionsOrdersFills);
  const [view, setView] = useState<PanelView>(
    allMarkets ? PanelView.AllMarkets : PanelView.CurrentMarket
  );
  const [viewIsolated, setViewIsolated] = useState<MarketTypeFilter>(MarketTypeFilter.AllMarkets);
  const [tab, setTab] = useState<InfoSection>(InfoSection.Position);

  const currentMarketId = useAppSelector(getCurrentMarketId);

  const { numTotalOpenOrders, numTotalUnseenFills } =
    useAppSelector(getTradeInfoNumbers, shallowEqual) ?? {};

  const { numOpenOrders, numUnseenFills } =
    useAppSelector(getCurrentMarketTradeInfoNumbers, shallowEqual) ?? {};

  const hasUnseenOrderUpdates = useAppSelector(getHasUnseenOrderUpdates);
  const hasUnseenFillUpdates = useAppSelector(getHasUnseenFillUpdates);
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
  const shouldRenderTriggers = useShouldShowTriggers();
  const shouldRenderActions = useParameterizedSelector(
    calculateShouldRenderActionsInPositionsTable
  );
  const isWaitingForOrderToIndex = useAppSelector(getHasUncommittedOrders);
  const showCurrentMarket = isTablet || view === PanelView.CurrentMarket;

  const numTotalPositions = (
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR
  ).length;

  const fillsTagNumber = shortenNumberForDisplay(
    showCurrentMarket ? numUnseenFills : numTotalUnseenFills
  );
  const ordersTagNumber = shortenNumberForDisplay(
    showCurrentMarket ? numOpenOrders : numTotalOpenOrders
  );

  const initialPageSize = 20;

  const onViewOrders = useCallback(
    (market: string) => {
      navigate(`${AppRoute.Trade}/${market}`, {
        state: {
          from: AppRoute.Trade,
        },
      });
      setView(PanelView.CurrentMarket);
      setTab(InfoSection.Orders);
    },
    [navigate]
  );

  const positionTabItem = useMemo(
    () => ({
      value: InfoSection.Position,
      label: stringGetter({
        key: showCurrentMarket ? STRING_KEYS.POSITION : STRING_KEYS.POSITIONS,
      }),

      tag: showCurrentMarket ? null : shortenNumberForDisplay(numTotalPositions),

      content: isTablet ? (
        <PositionInfo showNarrowVariation={isTablet} />
      ) : (
        <PositionsTable
          currentMarket={showCurrentMarket ? currentMarketId : undefined}
          marketTypeFilter={viewIsolated}
          columnKeys={[
            PositionsTableColumnKey.Market,
            PositionsTableColumnKey.Leverage,
            PositionsTableColumnKey.Type,
            PositionsTableColumnKey.Size,
            PositionsTableColumnKey.Value,
            PositionsTableColumnKey.PnL,
            PositionsTableColumnKey.Margin,
            PositionsTableColumnKey.AverageOpen,
            PositionsTableColumnKey.Oracle,
            PositionsTableColumnKey.Liquidation,
            PositionsTableColumnKey.NetFunding,
            shouldRenderTriggers && PositionsTableColumnKey.Triggers,
            shouldRenderActions && PositionsTableColumnKey.Actions,
          ].filter(isTruthy)}
          columnWidths={{
            [PositionsTableColumnKey.Actions]: 80,
          }}
          showClosePositionAction={shouldRenderActions}
          initialPageSize={initialPageSize}
          navigateToOrders={onViewOrders}
        />
      ),
    }),
    [
      stringGetter,
      currentMarketId,
      viewIsolated,
      showCurrentMarket,
      isTablet,
      shouldRenderActions,
      shouldRenderTriggers,
      numTotalPositions,
      onViewOrders,
    ]
  );

  const ordersTabItem = useMemo(
    () => ({
      asChild: true,
      value: InfoSection.Orders,
      label: stringGetter({ key: STRING_KEYS.ORDERS }),

      slotRight: isWaitingForOrderToIndex ? (
        <LoadingSpinner tw="[--spinner-width:1rem]" />
      ) : (
        ordersTagNumber && (
          <Tag type={TagType.Number} isHighlighted={hasUnseenOrderUpdates}>
            {ordersTagNumber}
          </Tag>
        )
      ),

      content: (
        <OrdersTable
          currentMarket={showCurrentMarket ? currentMarketId : undefined}
          marketTypeFilter={viewIsolated}
          columnKeys={
            isTablet
              ? [OrdersTableColumnKey.StatusFill, OrdersTableColumnKey.PriceType]
              : [
                  !showCurrentMarket && OrdersTableColumnKey.Market,
                  OrdersTableColumnKey.Status,
                  OrdersTableColumnKey.Side,
                  OrdersTableColumnKey.Amount,
                  OrdersTableColumnKey.Filled,
                  OrdersTableColumnKey.OrderValue,
                  OrdersTableColumnKey.Price,
                  OrdersTableColumnKey.Trigger,
                  OrdersTableColumnKey.MarginType,
                  OrdersTableColumnKey.GoodTil,
                  !isAccountViewOnly && OrdersTableColumnKey.Actions,
                ].filter(isTruthy)
          }
          initialPageSize={initialPageSize}
        />
      ),
    }),
    [
      stringGetter,
      currentMarketId,
      viewIsolated,
      showCurrentMarket,
      isTablet,
      isWaitingForOrderToIndex,
      isAccountViewOnly,
      ordersTagNumber,
      hasUnseenOrderUpdates,
    ]
  );

  const fillsTabItem = useMemo(
    () => ({
      asChild: true,
      value: InfoSection.Fills,
      label: stringGetter({ key: STRING_KEYS.FILLS }),

      slotRight: fillsTagNumber && (
        <Tag type={TagType.Number} isHighlighted={hasUnseenFillUpdates}>
          {fillsTagNumber}
        </Tag>
      ),

      content: (
        <FillsTable
          currentMarket={showCurrentMarket ? currentMarketId : undefined}
          columnKeys={
            isTablet
              ? [
                  FillsTableColumnKey.Time,
                  FillsTableColumnKey.TypeAmount,
                  FillsTableColumnKey.PriceFee,
                ]
              : [
                  !showCurrentMarket && FillsTableColumnKey.Market,
                  FillsTableColumnKey.Time,
                  FillsTableColumnKey.Type,
                  FillsTableColumnKey.Side,
                  FillsTableColumnKey.AmountTag,
                  FillsTableColumnKey.Price,
                  FillsTableColumnKey.Total,
                  FillsTableColumnKey.Fee,
                  FillsTableColumnKey.Liquidity,
                ].filter(isTruthy)
          }
          columnWidths={{
            [FillsTableColumnKey.TypeAmount]: '100%',
          }}
          initialPageSize={initialPageSize}
        />
      ),
    }),
    [
      stringGetter,
      currentMarketId,
      showCurrentMarket,
      isTablet,
      fillsTagNumber,
      hasUnseenFillUpdates,
    ]
  );

  const tabItems = useMemo(
    () => [positionTabItem, fillsTabItem, ordersTabItem],
    [positionTabItem, fillsTabItem, ordersTabItem]
  );

  const slotBottom = {
    [InfoSection.Position]: (
      <MaybeUnopenedIsolatedPositionsDrawer onViewOrders={onViewOrders} tw="mt-auto" />
    ),
    [InfoSection.Orders]: null,
    [InfoSection.Fills]: null,
    [InfoSection.Payments]: null,
  }[tab];

  return isTablet ? (
    <MobileTabs defaultValue={InfoSection.Position} items={tabItems} />
  ) : (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <$DragHandle onMouseDown={handleStartResize} />

      <$CollapsibleTabs
        defaultTab={InfoSection.Position}
        tab={tab}
        setTab={setTab}
        defaultOpen={isOpen}
        onOpenChange={setIsOpen}
        dividerStyle="underline"
        slotToolbar={
          <TradeTableSettings
            panelView={view}
            marketTypeFilter={viewIsolated}
            setPanelView={setView}
            setMarketTypeFilter={setViewIsolated}
            onOpenChange={setIsOpen}
          />
        }
        tabItems={tabItems}
      />
      {isOpen && slotBottom}
    </>
  );
};

const $DragHandle = styled.div`
  width: 100%;
  height: 0.5rem;
  cursor: ns-resize;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;

const $CollapsibleTabs = styled(CollapsibleTabs)`
  header {
    background-color: var(--color-layer-2);
  }

  --trigger-active-underline-backgroundColor: var(--color-layer-2);
` as typeof CollapsibleTabs;
