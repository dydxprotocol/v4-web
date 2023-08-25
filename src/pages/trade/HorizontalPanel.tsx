import { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { AssetIcon, type AssetSymbol } from '@/components/AssetIcon';
import { CollapsibleTabs } from '@/components/CollapsibleTabs';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { MobileTabs } from '@/components/Tabs';
import { Tag, TagType } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
// import { FundingPaymentsTable } from '@/views/tables/FundingPaymentsTable';
import { OrdersTable, OrdersTableColumnKey } from '@/views/tables/OrdersTable';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';

import {
  calculateHasUncommittedOrders,
  getCurrentMarketTradeInfoNumbers,
  getHasUnseenFillUpdates,
  getHasUnseenOrderUpdates,
  getTradeInfoNumbers,
} from '@/state/accountSelectors';

import { getCurrentMarketAssetId, getCurrentMarketId } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { shorternNumberForDisplay } from '@/lib/numbers';

import { PositionInfo } from '@/views/PositionInfo';

enum InfoSection {
  Position = 'Position',
  Orders = 'Orders',
  Fills = 'Fills',
  Payments = 'Payments',
}

enum PanelView {
  AllMarkets = 'AllMarkets',
  CurrentMarket = 'CurrentMarket',
}

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
};

export const HorizontalPanel = ({ isOpen = true, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const [view, setView] = useState<PanelView>(PanelView.CurrentMarket);
  const currentMarketId = useSelector(getCurrentMarketId);
  const currentMarketAssetId = useSelector(getCurrentMarketAssetId);

  const { numTotalPositions, numTotalOpenOrders, numTotalFills, numTotalFundingPayments } =
    useSelector(getTradeInfoNumbers, shallowEqual) || {};

  const { numOpenOrders, numFills, numFundingPayments } =
    useSelector(getCurrentMarketTradeInfoNumbers, shallowEqual) || {};

  const hasUnseenOrderUpdates = useSelector(getHasUnseenOrderUpdates);
  const hasUnseenFillUpdates = useSelector(getHasUnseenFillUpdates);
  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);
  const hasUncommittedOrders = useSelector(calculateHasUncommittedOrders);

  const showCurrentMarket = isTablet || view === PanelView.CurrentMarket;

  const fillsTagNumber = shorternNumberForDisplay(showCurrentMarket ? numFills : numTotalFills);

  const ordersTagNumber = shorternNumberForDisplay(
    showCurrentMarket ? numOpenOrders : numTotalOpenOrders
  );

  const tabItems = [
    {
      value: InfoSection.Position,
      label: stringGetter({
        key: showCurrentMarket ? STRING_KEYS.POSITION : STRING_KEYS.POSITIONS,
      }),

      tag: showCurrentMarket ? null : shorternNumberForDisplay(numTotalPositions),

      content: showCurrentMarket ? (
        <PositionInfo showNarrowVariation={isTablet} />
      ) : (
        <PositionsTable
          columnKeys={
            isTablet
              ? [
                  PositionsTableColumnKey.Details,
                  PositionsTableColumnKey.IndexEntry,
                  PositionsTableColumnKey.PnL,
                ]
              : [
                  PositionsTableColumnKey.Market,
                  PositionsTableColumnKey.Side,
                  PositionsTableColumnKey.Size,
                  PositionsTableColumnKey.Leverage,
                  PositionsTableColumnKey.LiquidationAndOraclePrice,
                  PositionsTableColumnKey.UnrealizedPnl,
                  PositionsTableColumnKey.RealizedPnl,
                  PositionsTableColumnKey.AverageOpenAndClose,
                ]
          }
          onNavigate={() => setView(PanelView.CurrentMarket)}
        />
      ),
    },
    {
      value: InfoSection.Orders,
      label: stringGetter({ key: STRING_KEYS.ORDERS }),

      slotRight: hasUncommittedOrders ? (
        <Styled.LoadingSpinner />
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
          columnKeys={
            isTablet
              ? [OrdersTableColumnKey.StatusFill, OrdersTableColumnKey.PriceType]
              : [
                  !showCurrentMarket && OrdersTableColumnKey.Market,
                  OrdersTableColumnKey.Status,
                  OrdersTableColumnKey.Side,
                  OrdersTableColumnKey.AmountFill,
                  OrdersTableColumnKey.Price,
                  OrdersTableColumnKey.Trigger,
                  OrdersTableColumnKey.GoodTil,
                  !isAccountViewOnly && OrdersTableColumnKey.Actions,
                ].filter(isTruthy)
          }
        />
      ),
    },
    {
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
                  FillsTableColumnKey.TotalFee,
                  FillsTableColumnKey.Liquidity,
                ].filter(isTruthy)
          }
          columnWidths={{
            [FillsTableColumnKey.TypeAmount]: '100%',
          }}
        />
      ),
    },
    // TODO - TRCL-1693 - re-enable when funding payments are supported
    // {
    //   value: InfoSection.Payments,
    //   label: stringGetter({ key: STRING_KEYS.PAYMENTS }),

    //   tag: shorternNumberForDisplay(
    //     showCurrentMarket ? numFundingPayments : numTotalFundingPayments
    //   ),
    //   content: (
    //     <FundingPaymentsTable currentMarket={showCurrentMarket ? currentMarket?.id : undefined} />
    //   ),
    // },
  ];

  return isTablet ? (
    <MobileTabs defaultValue={InfoSection.Position} items={tabItems} withBorders={false} />
  ) : (
    <Styled.CollapsibleTabs
      defaultValue={InfoSection.Position}
      defaultOpen={isOpen}
      onOpenChange={setIsOpen}
      slotToolbar={
        <ToggleGroup
          items={[
            {
              value: PanelView.AllMarkets,
              label: stringGetter({ key: STRING_KEYS.ALL }),
            },
            {
              value: PanelView.CurrentMarket,
              ...(currentMarketAssetId
                ? {
                    slotBefore: <Styled.AssetIcon symbol={currentMarketAssetId as AssetSymbol} />,
                    label: currentMarketAssetId,
                  }
                : { label: stringGetter({ key: STRING_KEYS.MARKET }) }),
            },
          ]}
          value={view}
          onValueChange={(newView: string) => {
            setView((newView || view) as PanelView);
            setIsOpen?.(true);
          }}
        />
      }
      items={tabItems}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AssetIcon = styled(AssetIcon)`
  height: 1.5em;
`;

Styled.CollapsibleTabs = styled(CollapsibleTabs)`
  --tableHeader-backgroundColor: var(--color-layer-3);

  header {
    background-color: var(--color-layer-2);
  }
`;

Styled.LoadingSpinner = styled(LoadingSpinner)`
  --spinner-width: 1rem;
`;
