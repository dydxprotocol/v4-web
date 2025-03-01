import { useCallback, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
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
  createGetOpenOrdersCount,
  createGetUnseenFillsCount,
  createGetUnseenOpenOrdersCount,
  createGetUnseenOrderHistoryCount,
} from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import { getHasUncommittedOrders } from '@/state/localOrdersSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { shortenNumberForDisplay } from '@/lib/numbers';

import { TradeTableSettings } from './TradeTableSettings';
import { MaybeUnopenedIsolatedPositionsDrawer } from './UnopenedIsolatedPositions';
import { MarketTypeFilter, PanelView } from './types';

enum InfoSection {
  Position = 'Position',
  Orders = 'Orders',
  OrderHistory = 'OrderHistory',
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

  const areFillsLoading = useAppSelector(BonsaiCore.account.fills.loading) === 'pending';
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

  const shouldRenderTriggers = useShouldShowTriggers();
  const shouldRenderActions = useParameterizedSelector(
    calculateShouldRenderActionsInPositionsTable
  );
  const isWaitingForOrderToIndex = useAppSelector(getHasUncommittedOrders);
  const areOrdersLoading = useAppSelector(BonsaiCore.account.openOrders.loading) === 'pending';
  const showCurrentMarket = isTablet || view === PanelView.CurrentMarket;
  const numUnseenOrderHistory = useParameterizedSelector(
    createGetUnseenOrderHistoryCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const orderHistoryTagNumber = shortenNumberForDisplay(numUnseenOrderHistory);

  const openOrdersCount = useParameterizedSelector(
    createGetOpenOrdersCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const unseenOpenOrdersCount = useParameterizedSelector(
    createGetUnseenOpenOrdersCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const ordersTagNumber = shortenNumberForDisplay(openOrdersCount);

  const numTotalPositions = (
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR
  ).length;

  const numUnseenFills = useParameterizedSelector(
    createGetUnseenFillsCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const fillsTagNumber = shortenNumberForDisplay(numUnseenFills);

  const hasUnseenOrderUpdates = unseenOpenOrdersCount > 0;
  const hasUnseenFillUpdates = numUnseenFills > 0;

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
      label: stringGetter({ key: STRING_KEYS.OPEN_ORDERS_HEADER }),

      slotRight:
        areOrdersLoading || isWaitingForOrderToIndex ? (
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
          tableType="OPEN"
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
      areOrdersLoading,
      isWaitingForOrderToIndex,
      ordersTagNumber,
      hasUnseenOrderUpdates,
      showCurrentMarket,
      currentMarketId,
      viewIsolated,
      isTablet,
      isAccountViewOnly,
    ]
  );

  const orderHistoryTabItem = useMemo(
    () => ({
      asChild: true,
      value: InfoSection.OrderHistory,
      label: stringGetter({ key: STRING_KEYS.ORDER_HISTORY_HEADER }),

      slotRight: areOrdersLoading ? (
        <LoadingSpinner tw="[--spinner-width:1rem]" />
      ) : (
        orderHistoryTagNumber &&
        numUnseenOrderHistory > 0 && (
          <Tag type={TagType.Number} isHighlighted={numUnseenOrderHistory > 0}>
            {orderHistoryTagNumber}
          </Tag>
        )
      ),

      content: (
        <OrdersTable
          currentMarket={showCurrentMarket ? currentMarketId : undefined}
          marketTypeFilter={viewIsolated}
          tableType="HISTORY"
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
                  OrdersTableColumnKey.Updated,
                ].filter(isTruthy)
          }
          initialPageSize={initialPageSize}
        />
      ),
    }),
    [
      stringGetter,
      areOrdersLoading,
      orderHistoryTagNumber,
      numUnseenOrderHistory,
      showCurrentMarket,
      currentMarketId,
      viewIsolated,
      isTablet,
    ]
  );

  const fillsTabItem = useMemo(
    () => ({
      asChild: true,
      value: InfoSection.Fills,
      label: stringGetter({ key: STRING_KEYS.FILLS }),

      slotRight: areFillsLoading ? (
        <LoadingSpinner tw="[--spinner-width:1rem]" />
      ) : (
        fillsTagNumber && (
          <Tag type={TagType.Number} isHighlighted={hasUnseenFillUpdates}>
            {fillsTagNumber}
          </Tag>
        )
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
      areFillsLoading,
      fillsTagNumber,
      hasUnseenFillUpdates,
      showCurrentMarket,
      currentMarketId,
      isTablet,
    ]
  );

  const tabItems = useMemo(
    () => [positionTabItem, ordersTabItem, fillsTabItem, orderHistoryTabItem],
    [positionTabItem, fillsTabItem, ordersTabItem, orderHistoryTabItem]
  );

  const slotBottom = {
    [InfoSection.Position]: (
      <MaybeUnopenedIsolatedPositionsDrawer onViewOrders={onViewOrders} tw="mt-auto" />
    ),
    [InfoSection.Orders]: null,
    [InfoSection.OrderHistory]: null,
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
