import { useCallback, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useShouldShowTriggers } from '@/hooks/useShouldShowTriggers';
import { useStringGetter } from '@/hooks/useStringGetter';

import { CollapsibleTabs } from '@/components/CollapsibleTabs';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Tag, TagType } from '@/components/Tag';
import {
  FundingPaymentsTable,
  FundingPaymentsTableColumnKey,
} from '@/pages/funding/FundingPaymentsTable';
import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { MobilePositionsTable } from '@/views/tables/MobilePositionsTable';
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
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import { openDialog } from '@/state/dialogs';
import { getHasUncommittedOrders } from '@/state/localOrdersSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { shortenNumberForDisplay } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import MarketStats from './MarketStats';
import { TradeTableSettings } from './TradeTableSettings';
import { MaybeUnopenedIsolatedPositionsDrawer } from './UnopenedIsolatedPositions';
import { MarketTypeFilter, PanelView } from './types';

enum InfoSection {
  Details = 'Details',
  Position = 'Position',
  Orders = 'Orders',
  OrderHistory = 'OrderHistory',
  Fills = 'Fills',
  Payments = 'Payments',
}

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
};

export const HorizontalPanel = ({ isOpen = true, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
  const shouldRenderActions = useAppSelectorWithArgs(calculateShouldRenderActionsInPositionsTable);
  const isWaitingForOrderToIndex = useAppSelector(getHasUncommittedOrders);
  const areOrdersLoading = useAppSelector(BonsaiCore.account.openOrders.loading) === 'pending';
  const showCurrentMarket = isTablet || view === PanelView.CurrentMarket;
  const numUnseenOrderHistory = useAppSelectorWithArgs(
    createGetUnseenOrderHistoryCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const orderHistoryTagNumber = shortenNumberForDisplay(numUnseenOrderHistory);
  const subAccount = orEmptyObj(useAppSelector(BonsaiCore.account.parentSubaccountSummary.data));

  const openOrdersCount = useAppSelectorWithArgs(
    createGetOpenOrdersCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const unseenOpenOrdersCount = useAppSelectorWithArgs(
    createGetUnseenOpenOrdersCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const ordersTagNumber = shortenNumberForDisplay(openOrdersCount);

  const numTotalPositions = (
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR
  ).length;

  const numUnseenFills = useAppSelectorWithArgs(
    createGetUnseenFillsCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const fillsTagNumber = shortenNumberForDisplay(numUnseenFills);

  const hasUnseenOrderUpdates = unseenOpenOrdersCount > 0;
  const hasUnseenFillUpdates = numUnseenFills > 0;

  const initialPageSize = 20;

  const { freeCollateral: availableBalance } = subAccount;

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

  const detailsTabItem = useMemo(
    () => ({
      value: InfoSection.Details,
      label: stringGetter({
        key: STRING_KEYS.DETAILS,
      }),
      content: <MarketStats />,
    }),
    [stringGetter]
  );

  const positionTabItem = useMemo(
    () => ({
      value: InfoSection.Position,
      label: stringGetter({
        key: showCurrentMarket ? STRING_KEYS.POSITION : STRING_KEYS.POSITIONS,
      }),

      tag: showCurrentMarket ? null : shortenNumberForDisplay(numTotalPositions),

      content: isTablet ? (
        <MobilePositionsTable
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
      label: stringGetter({ key: isTablet ? STRING_KEYS.ORDERS : STRING_KEYS.OPEN_ORDERS_HEADER }),

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
      label: stringGetter({
        key: isTablet ? STRING_KEYS.HISTORY : STRING_KEYS.ORDER_HISTORY_HEADER,
      }),

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
                  FillsTableColumnKey.ClosedPnl,
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

  const paymentsTabItem = useMemo(
    () => ({
      asChild: true,
      value: InfoSection.Payments,
      label: stringGetter({
        key: isTablet ? STRING_KEYS.FUNDING_PAYMENTS_SHORT : STRING_KEYS.FUNDING_PAYMENTS,
      }),

      content: (
        <FundingPaymentsTable
          currentMarket={showCurrentMarket ? currentMarketId : undefined}
          shortRows
          columnKeys={
            isTablet
              ? [
                  FundingPaymentsTableColumnKey.Time,
                  FundingPaymentsTableColumnKey.Payment,
                  FundingPaymentsTableColumnKey.Rate,
                ]
              : [
                  !showCurrentMarket && FundingPaymentsTableColumnKey.Market,
                  FundingPaymentsTableColumnKey.Time,
                  FundingPaymentsTableColumnKey.Side,
                  FundingPaymentsTableColumnKey.OraclePrice,
                  FundingPaymentsTableColumnKey.Size,
                  FundingPaymentsTableColumnKey.Payment,
                  FundingPaymentsTableColumnKey.Rate,
                ].filter(isTruthy)
          }
          initialPageSize={initialPageSize}
        />
      ),
    }),
    [stringGetter, showCurrentMarket, isTablet, initialPageSize, currentMarketId]
  );

  const tabItems = useMemo(
    () => [
      detailsTabItem,
      positionTabItem,
      ordersTabItem,
      fillsTabItem,
      orderHistoryTabItem,
      paymentsTabItem,
    ],
    [
      detailsTabItem,
      positionTabItem,
      fillsTabItem,
      ordersTabItem,
      orderHistoryTabItem,
      paymentsTabItem,
    ]
  );

  const slotBottom = {
    [InfoSection.Details]: null,
    [InfoSection.Position]: (
      <MaybeUnopenedIsolatedPositionsDrawer onViewOrders={onViewOrders} tw="mt-auto" />
    ),
    [InfoSection.Orders]: null,
    [InfoSection.OrderHistory]: null,
    [InfoSection.Fills]: null,
    [InfoSection.Payments]: null,
  }[tab];

  return (
    <>
      {isTablet && (
        <div tw="mx-1.5 mb-1 mt-0.5">
          <div
            tw="flex w-full flex-1 items-center justify-between rounded-0.25 bg-color-layer-3 px-1 py-0.75"
            onClick={() => dispatch(openDialog(DialogTypes.Deposit2({})))}
          >
            <span tw="text-color-text-0">
              {stringGetter({ key: STRING_KEYS.AVAILABLE_TO_TRADE })}
            </span>
            <div tw="flex gap-0.25">
              <Output type={OutputType.Fiat} value={availableBalance} />
              <Icon iconName={IconName.PlusCircle} size="1.5rem" tw="text-color-accent" />
            </div>
          </div>
        </div>
      )}

      <$CollapsibleTabs
        defaultTab={InfoSection.Position}
        tab={tab}
        setTab={setTab}
        defaultOpen={isOpen}
        onOpenChange={setIsOpen}
        dividerStyle="underline"
        slotToolbar={
          isTablet ? null : (
            <TradeTableSettings
              panelView={view}
              marketTypeFilter={viewIsolated}
              setPanelView={setView}
              setMarketTypeFilter={setViewIsolated}
              onOpenChange={setIsOpen}
            />
          )
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
