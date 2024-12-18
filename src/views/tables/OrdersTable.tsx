import { forwardRef, Key, ReactNode, useEffect, useMemo } from 'react';

import { AssetInfo } from '@/abacus-ts/rawTypes';
import {
  selectCurrentMarketOpenOrders,
  selectCurrentMarketOrderHistory,
  selectOpenOrders,
  selectOrderHistory,
} from '@/abacus-ts/selectors/account';
import { selectRawAssetsData, selectRawMarketsData } from '@/abacus-ts/selectors/base';
import { OrderStatus, SubaccountOrder } from '@/abacus-ts/summaryTypes';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';
import { ColumnSize } from '@react-types/table';
import type { Dispatch } from '@reduxjs/toolkit';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { Nullable } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { MarketTableCellNew } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { Tag, TagSize } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';
import { MarketTypeFilter, marketTypeMatchesFilter } from '@/pages/trade/types';

import { viewedOrders } from '@/state/account';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getHasUnseenOrderUpdates } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { assertNever } from '@/lib/assertNever';
import { getAssetFromMarketId } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { MustBigNumber } from '@/lib/numbers';
import {
  getHydratedOrder,
  getOrderStatusInfoNew,
  isMarketOrderTypeNew,
  isNewOrderStatusClearable,
} from '@/lib/orders';
import { getMarginModeFromSubaccountNumber } from '@/lib/tradeData';
import { orEmptyRecord } from '@/lib/typeUtils';

import { OrderStatusIconNew } from '../OrderStatusIcon';
import { CancelOrClearAllOrdersButton } from './OrdersTable/CancelOrClearAllOrdersButton';
import { OrderActionsCell } from './OrdersTable/OrderActionsCell';

export enum OrdersTableColumnKey {
  Market = 'Market',
  Status = 'Status',
  Side = 'Side',
  Amount = 'Amount',
  Filled = 'Filled',
  OrderValue = 'Order-Value',
  Price = 'Price',
  Trigger = 'Trigger',
  GoodTil = 'Good-Til',
  Actions = 'Actions',
  MarginType = 'Margin-Type',

  // Tablet Only
  StatusFill = 'Status-Fill',
  PriceType = 'Price-Type',
}

export type OrderTableRow = {
  asset: Nullable<AssetInfo>;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
} & SubaccountOrder;

const getOrdersTableColumnDef = ({
  key,
  currentMarket,
  stringGetter,
  symbol = '',
  isAccountViewOnly,
  width,
}: {
  key: OrdersTableColumnKey;
  currentMarket?: string;
  dispatch: Dispatch;
  isTablet?: boolean;
  stringGetter: StringGetterFunction;
  symbol?: Nullable<string>;
  isAccountViewOnly: boolean;
  width?: ColumnSize;
  // todo add back output type, undo this change before committing
}) => ({
  width,
  ...(
    {
      [OrdersTableColumnKey.Market]: {
        columnKey: 'marketId',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ asset }) => <MarketTableCellNew asset={asset ?? undefined} />,
      },
      [OrdersTableColumnKey.Status]: {
        columnKey: 'status',
        getCellValue: (row) => row.status,
        label: stringGetter({ key: STRING_KEYS.STATUS }),
        renderCell: ({ status, type }) => {
          return (
            <TableCell>
              <WithTooltip
                tooltipString={
                  status != null
                    ? stringGetter({ key: getOrderStatusStringKey(status) })
                    : undefined
                }
                side="right"
                tw="[--tooltip-backgroundColor:--color-layer-5]"
              >
                {status != null && <OrderStatusIconNew status={status} />}
              </WithTooltip>
              {stringGetter({ key: getIndexerOrderTypeStringKey(type) })}
            </TableCell>
          );
        },
      },
      [OrdersTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.side,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ side }) => <OrderSideTag orderSide={side} size={TagSize.Medium} />,
      },
      [OrdersTableColumnKey.Amount]: {
        columnKey: 'amount',
        getCellValue: (row) => row.size.toNumber(),
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        tag: symbol,
        renderCell: ({ size, stepSizeDecimals }) => (
          <TableCell>
            <Output
              type={OutputType.Asset}
              value={size}
              fractionDigits={stepSizeDecimals ?? TOKEN_DECIMALS}
            />
          </TableCell>
        ),
      },
      [OrdersTableColumnKey.Filled]: {
        columnKey: 'filled',
        getCellValue: (row) => row.totalFilled?.toNumber(),
        label: stringGetter({ key: STRING_KEYS.AMOUNT_FILLED }),
        tag: symbol,
        renderCell: ({ totalFilled, stepSizeDecimals }) => (
          <TableCell>
            <Output
              type={OutputType.Asset}
              value={totalFilled}
              fractionDigits={stepSizeDecimals ?? TOKEN_DECIMALS}
            />
          </TableCell>
        ),
      },
      [OrdersTableColumnKey.OrderValue]: {
        columnKey: 'orderValue',
        getCellValue: (row) =>
          MustBigNumber(row.size)
            .abs()
            .multipliedBy(row.triggerPrice ?? row.price)
            .toNumber(),
        label: stringGetter({ key: STRING_KEYS.ORDER_VALUE }),
        renderCell: ({ size, price, triggerPrice }) => (
          <TableCell>
            <Output
              type={OutputType.Fiat}
              value={MustBigNumber(size)
                .abs()
                .multipliedBy(triggerPrice ?? price)}
            />
          </TableCell>
        ),
      },
      [OrdersTableColumnKey.Price]: {
        columnKey: 'price',
        getCellValue: (row) => row.price.toNumber(),
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        renderCell: ({ type, price, tickSizeDecimals }) =>
          isMarketOrderTypeNew(type) ? (
            stringGetter({ key: STRING_KEYS.MARKET_PRICE_SHORT })
          ) : (
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={price}
              fractionDigits={tickSizeDecimals}
            />
          ),
      },
      [OrdersTableColumnKey.Trigger]: {
        columnKey: 'triggerPrice',
        getCellValue: (row) => row.triggerPrice?.toNumber() ?? -1,
        label: stringGetter({ key: STRING_KEYS.TRIGGER_PRICE_SHORT }),
        renderCell: ({ triggerPrice, tickSizeDecimals }) => (
          <TableCell stacked>
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={triggerPrice}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [OrdersTableColumnKey.GoodTil]: {
        columnKey: 'expiresAtMilliseconds',
        getCellValue: (row) => row.expiresAtMilliseconds ?? Infinity,
        label: stringGetter({ key: STRING_KEYS.GOOD_TIL }),
        renderCell: ({ expiresAtMilliseconds }) => {
          if (!expiresAtMilliseconds) return <Output type={OutputType.Text} />;

          return (
            <Output
              type={OutputType.RelativeTime}
              value={expiresAtMilliseconds}
              relativeTimeOptions={{ format: 'singleCharacter' }}
            />
          );
        },
      },
      [OrdersTableColumnKey.Actions]: {
        columnKey: 'cancelOrClear',
        label: <CancelOrClearAllOrdersButton marketId={currentMarket} />,
        isActionable: true,
        allowsSorting: false,
        renderCell: ({ id, status, orderFlags }) => (
          <OrderActionsCell
            orderId={id}
            status={status ?? OrderStatus.Open}
            orderFlags={orderFlags}
            isDisabled={isAccountViewOnly}
          />
        ),
      },
      [OrdersTableColumnKey.StatusFill]: {
        columnKey: 'statusFill',
        getCellValue: (row) => row.status,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.STATUS })}</span>
            <span>
              {stringGetter({
                key: STRING_KEYS.FILL,
              })}
            </span>
          </TableColumnHeader>
        ),
        renderCell: ({ asset, size, status, totalFilled }) => {
          const { statusIconColor } = getOrderStatusInfoNew({ status: status ?? OrderStatus.Open });

          return (
            <TableCell
              stacked
              slotLeft={
                <$AssetIconWithStatus>
                  <$AssetIcon logoUrl={asset?.logo} symbol={asset?.id} />
                  <$StatusDot color={statusIconColor} />
                </$AssetIconWithStatus>
              }
            >
              <span>
                {status != null && stringGetter({ key: getOrderStatusStringKey(status) })}
              </span>
              <$InlineRow>
                <Output
                  type={OutputType.Asset}
                  value={totalFilled}
                  fractionDigits={TOKEN_DECIMALS}
                />
                /
                <Output
                  type={OutputType.Asset}
                  value={size}
                  fractionDigits={TOKEN_DECIMALS}
                  tag={asset?.id}
                />
              </$InlineRow>
            </TableCell>
          );
        },
      },
      [OrdersTableColumnKey.PriceType]: {
        columnKey: 'priceType',
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.PRICE })}</span>
            <span>{stringGetter({ key: STRING_KEYS.TYPE })}</span>
          </TableColumnHeader>
        ),
        getCellValue: (row) => row.price.toNumber(),
        renderCell: ({ price, side, type, tickSizeDecimals }) => (
          <TableCell stacked>
            <$InlineRow>
              <$Side side={side}>{stringGetter({ key: getIndexerOrderSideStringKey(side) })}</$Side>
              <span tw="text-color-text-0">@</span>
              <Output
                withSubscript
                type={OutputType.Fiat}
                value={price}
                fractionDigits={tickSizeDecimals}
              />
            </$InlineRow>
            <span>{stringGetter({ key: getIndexerOrderTypeStringKey(type) })}</span>
          </TableCell>
        ),
      },
      [OrdersTableColumnKey.MarginType]: {
        columnKey: 'marginType',
        label: stringGetter({ key: STRING_KEYS.MARGIN_MODE }),
        getCellValue: (row) => getMarginModeFromSubaccountNumber(row.subaccountNumber).name,
        renderCell({ marginMode }): ReactNode {
          const marginModeLabel =
            marginMode === 'CROSS'
              ? stringGetter({ key: STRING_KEYS.CROSS })
              : stringGetter({ key: STRING_KEYS.ISOLATED });
          return <Tag> {marginModeLabel} </Tag>;
        },
      },
    } satisfies Record<OrdersTableColumnKey, ColumnDef<OrderTableRow>>
  )[key],
});

function getOrderStatusStringKey(status: OrderStatus | undefined): string {
  if (!status) return STRING_KEYS.PENDING;

  switch (status) {
    case OrderStatus.Open:
      return STRING_KEYS.OPEN_STATUS;
    case OrderStatus.Canceled:
      return STRING_KEYS.CANCELED;
    case OrderStatus.Canceling:
      return STRING_KEYS.CANCELING;
    case OrderStatus.Filled:
      return STRING_KEYS.ORDER_FILLED;
    case OrderStatus.Pending:
      return STRING_KEYS.PENDING;
    case OrderStatus.Untriggered:
      return STRING_KEYS.UNTRIGGERED;
    case OrderStatus.PartiallyFilled:
      return STRING_KEYS.PARTIALLY_FILLED;
    case OrderStatus.PartiallyCanceled:
      return STRING_KEYS.PARTIALLY_FILLED;
    default:
      assertNever(status);
      return STRING_KEYS.PENDING;
  }
}

function getIndexerOrderTypeStringKey(type: IndexerOrderType): string {
  switch (type) {
    case IndexerOrderType.MARKET:
      return STRING_KEYS.MARKET_ORDER_SHORT;
    case IndexerOrderType.STOPLIMIT:
      return STRING_KEYS.STOP_LIMIT;
    case IndexerOrderType.STOPMARKET:
      return STRING_KEYS.STOP_MARKET;
    case IndexerOrderType.LIMIT:
      return STRING_KEYS.LIMIT_ORDER_SHORT;
    case IndexerOrderType.TRAILINGSTOP:
      return STRING_KEYS.TRAILING_STOP;
    case IndexerOrderType.TAKEPROFIT:
      return STRING_KEYS.TAKE_PROFIT_LIMIT_SHORT;
    case IndexerOrderType.TAKEPROFITMARKET:
      return STRING_KEYS.TAKE_PROFIT_MARKET_SHORT;
    default:
      assertNever(type);
      return STRING_KEYS.LIMIT_ORDER_SHORT;
  }
}

function getIndexerOrderSideStringKey(side: IndexerOrderSide): string {
  if (side === IndexerOrderSide.BUY) {
    return STRING_KEYS.BUY;
  }
  return STRING_KEYS.SELL;
}

type ElementProps = {
  columnKeys: OrdersTableColumnKey[];
  columnWidths?: Partial<Record<OrdersTableColumnKey, ColumnSize>>;
  currentMarket?: string;
  marketTypeFilter?: MarketTypeFilter;
  tableType: 'OPEN' | 'HISTORY';
  initialPageSize?: PageSize;
};

type StyleProps = {
  withOuterBorder?: boolean;
};

export const OrdersTable = forwardRef(
  (
    {
      columnKeys = [],
      columnWidths,
      currentMarket,
      marketTypeFilter,
      initialPageSize,
      withOuterBorder,
      tableType,
    }: ElementProps & StyleProps,
    _ref
  ) => {
    const stringGetter = useStringGetter();
    const dispatch = useAppDispatch();
    const { isTablet } = useBreakpoints();

    const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
    const marketOrders = useAppSelector(
      tableType === 'OPEN' ? selectCurrentMarketOpenOrders : selectCurrentMarketOrderHistory
    );
    const allOrders = useAppSelector(tableType === 'OPEN' ? selectOpenOrders : selectOrderHistory);

    const orders = useMemo(
      () =>
        (currentMarket ? marketOrders : allOrders).filter((order) => {
          const orderType = getMarginModeFromSubaccountNumber(order.subaccountNumber).name;
          return marketTypeMatchesFilter(orderType, marketTypeFilter);
        }),
      [allOrders, currentMarket, marketOrders, marketTypeFilter]
    );

    const allPerpetualMarkets = orEmptyRecord(useAppSelector(selectRawMarketsData));
    const allAssets = orEmptyRecord(useAppSelector(selectRawAssetsData));

    const hasUnseenOrderUpdates = useAppSelector(getHasUnseenOrderUpdates);

    useEffect(() => {
      if (hasUnseenOrderUpdates) dispatch(viewedOrders());
    }, [dispatch, hasUnseenOrderUpdates]);

    const symbol = mapIfPresent(currentMarket, (market) =>
      mapIfPresent(
        allPerpetualMarkets[market]?.ticker,
        (ticker) => allAssets[getAssetFromMarketId(ticker)]?.id
      )
    );

    const ordersData = useMemo(
      () =>
        orders.map(
          (order: SubaccountOrder): OrderTableRow =>
            getHydratedOrder({
              data: order,
              assets: allAssets,
              perpetualMarkets: allPerpetualMarkets,
            })
        ),
      [orders, allPerpetualMarkets, allAssets]
    );

    return (
      <$Table
        key={currentMarket ?? 'all-orders'}
        label="Orders"
        data={ordersData}
        getRowKey={(row: OrderTableRow) => row.id}
        getRowAttributes={(row: OrderTableRow) => ({
          'data-clearable': row.status != null && isNewOrderStatusClearable(row.status),
        })}
        onRowAction={(key: Key) =>
          dispatch(openDialog(DialogTypes.OrderDetails({ orderId: `${key}` })))
        }
        columns={columnKeys.map((key: OrdersTableColumnKey) =>
          getOrdersTableColumnDef({
            key,
            currentMarket,
            dispatch,
            isTablet,
            stringGetter,
            symbol,
            isAccountViewOnly,
            width: columnWidths?.[key],
          })
        )}
        slotEmpty={
          <>
            <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
            <h4>{stringGetter({ key: STRING_KEYS.ORDERS_EMPTY_STATE })}</h4>
          </>
        }
        initialPageSize={initialPageSize}
        withOuterBorder={withOuterBorder}
        withInnerBorders
        withScrollSnapColumns
        withScrollSnapRows
        withFocusStickyRows
      />
    );
  }
);

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  tbody tr {
    &[data-clearable='true'] {
      opacity: 0.5;
    }
  }
` as typeof Table;

const $InlineRow = tw.div`inlineRow`;

const $AssetIcon = styled(AssetIcon)`
  font-size: 2rem;

  @media ${breakpoints.tablet} {
    font-size: 2.25rem;
  }
`;

const $Side = styled.span<{ side?: IndexerOrderSide | null }>`
  ${({ side }) =>
    side &&
    {
      [IndexerOrderSide.BUY]: css`
        color: var(--color-positive);
      `,
      [IndexerOrderSide.SELL]: css`
        color: var(--color-negative);
      `,
    }[side]};
`;

const $AssetIconWithStatus = styled.div`
  ${layoutMixins.stack}

  ${$AssetIcon} {
    margin: 0.125rem;
  }
`;

const $StatusDot = styled.div<{ color: string }>`
  place-self: start end;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  border: 2px solid var(--tableRow-currentBackgroundColor);

  background-color: ${({ color }) => color};
`;
