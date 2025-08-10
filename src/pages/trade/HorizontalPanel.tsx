import { useCallback, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useShouldShowTriggers } from '@/hooks/useShouldShowTriggers';
import { useStringGetter } from '@/hooks/useStringGetter';

import { CollapsibleTabs } from '@/components/CollapsibleTabs';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { MobileTabs } from '@/components/Tabs';
import { Tag, TagType } from '@/components/Tag';
import {
  FundingPaymentsTable,
  FundingPaymentsTableColumnKey,
} from '@/pages/funding/FundingPaymentsTable';
import { PositionInfo } from '@/views/PositionInfo';
import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import { calculateShouldRenderActionsInPositionsTable } from '@/state/accountCalculators';
import { createGetUnseenFillsCount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

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

export const HorizontalPanel = ({ isOpen = false, setIsOpen, handleStartResize }: ElementProps) => {
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

  const shouldRenderTriggers = useShouldShowTriggers();
  const shouldRenderActions = useAppSelectorWithArgs(calculateShouldRenderActionsInPositionsTable);
  const showCurrentMarket = isTablet || view === PanelView.CurrentMarket;

  const numTotalPositions = (
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR
  ).length;

  const numUnseenFills = useAppSelectorWithArgs(
    createGetUnseenFillsCount,
    showCurrentMarket ? currentMarketId : undefined
  );
  const fillsTagNumber = shortenNumberForDisplay(numUnseenFills);

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

  const paymentsTabItem = useMemo(
    () => ({
      asChild: true,
      value: InfoSection.Payments,
      label: stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS }),

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
    () => [positionTabItem, fillsTabItem, paymentsTabItem],
    [positionTabItem, fillsTabItem, paymentsTabItem]
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
