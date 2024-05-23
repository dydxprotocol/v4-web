import { Key, useEffect, useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { ColumnSize } from '@react-types/table';
import type { Dispatch } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import { Asset, Nullable, SubaccountOrder } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';

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
import { MarketTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { TagSize } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { viewedOrders } from '@/state/account';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import {
  getCurrentMarketOrders,
  getHasUnseenOrderUpdates,
  getSubaccountUnclearedOrders,
} from '@/state/accountSelectors';
import { getAssets } from '@/state/assetsSelectors';
import { openDialog } from '@/state/dialogs';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import {
  getHydratedTradingData,
  getOrderStatusInfo,
  isMarketOrderType,
  isOrderStatusClearable,
} from '@/lib/orders';
import { getStringsForDateTimeDiff } from '@/lib/timeUtils';
import { orEmptyObj } from '@/lib/typeUtils';

import { OrderStatusIcon } from '../OrderStatusIcon';
import { OrderActionsCell } from './OrdersTable/OrderActionsCell';

export enum OrdersTableColumnKey {
  Market = 'Market',
  Status = 'Status',
  Side = 'Side',
  AmountFill = 'Amount-Fill',
  Price = 'Price',
  Trigger = 'Trigger',
  GoodTil = 'Good-Til',
  Actions = 'Actions',

  // Tablet Only
  StatusFill = 'Status-Fill',
  PriceType = 'Price-Type',
}

export type OrderTableRow = {
  asset: Asset;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
  orderSide: OrderSide;
} & SubaccountOrder;

const getOrdersTableColumnDef = ({
  key,
  stringGetter,
  symbol = '',
  isAccountViewOnly,
  width,
}: {
  key: OrdersTableColumnKey;
  dispatch: Dispatch;
  isTablet?: boolean;
  stringGetter: StringGetterFunction;
  symbol?: Nullable<string>;
  isAccountViewOnly: boolean;
  width?: ColumnSize;
}): ColumnDef<OrderTableRow> => ({
  width,

  ...(
    {
      [OrdersTableColumnKey.Market]: {
        columnKey: 'marketId',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ asset, marketId }) => <MarketTableCell asset={asset} marketId={marketId} />,
      },
      [OrdersTableColumnKey.Status]: {
        columnKey: 'status',
        getCellValue: (row) => row.status.name,
        label: stringGetter({ key: STRING_KEYS.STATUS }),
        renderCell: ({ status, resources }) => {
          return (
            <TableCell>
              <$WithTooltip
                tooltipString={
                  resources.statusStringKey
                    ? stringGetter({ key: resources.statusStringKey })
                    : undefined
                }
                side="right"
              >
                <OrderStatusIcon status={status.rawValue} />
              </$WithTooltip>
              {resources.typeStringKey && stringGetter({ key: resources.typeStringKey })}
            </TableCell>
          );
        },
      },
      [OrdersTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.orderSide,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ orderSide }) => <OrderSideTag orderSide={orderSide} size={TagSize.Medium} />,
      },
      [OrdersTableColumnKey.AmountFill]: {
        columnKey: 'size',
        getCellValue: (row) => row.size,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.AMOUNT })}</span>
            <span>{stringGetter({ key: STRING_KEYS.AMOUNT_FILLED })}</span>
          </TableColumnHeader>
        ),
        tag: symbol,
        renderCell: ({ size, totalFilled, stepSizeDecimals }) => (
          <TableCell stacked>
            <Output
              type={OutputType.Asset}
              value={size}
              fractionDigits={stepSizeDecimals < TOKEN_DECIMALS ? TOKEN_DECIMALS : stepSizeDecimals}
            />
            <Output
              type={OutputType.Asset}
              value={totalFilled}
              fractionDigits={stepSizeDecimals < TOKEN_DECIMALS ? TOKEN_DECIMALS : stepSizeDecimals}
            />
          </TableCell>
        ),
      },
      [OrdersTableColumnKey.Price]: {
        columnKey: 'price',
        getCellValue: (row) => row.price,
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        renderCell: ({ type, price, tickSizeDecimals }) =>
          isMarketOrderType(type) ? (
            stringGetter({ key: STRING_KEYS.MARKET_PRICE_SHORT })
          ) : (
            <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
          ),
      },
      [OrdersTableColumnKey.Trigger]: {
        columnKey: 'triggerPrice',
        getCellValue: (row) => row.triggerPrice ?? -1,
        label: stringGetter({ key: STRING_KEYS.TRIGGER_PRICE_SHORT }),
        renderCell: ({ triggerPrice, trailingPercent, tickSizeDecimals }) => (
          <TableCell stacked>
            <Output type={OutputType.Fiat} value={triggerPrice} fractionDigits={tickSizeDecimals} />
            {trailingPercent && (
              <span>
                <Output
                  type={OutputType.Percent}
                  value={MustBigNumber(trailingPercent).abs().div(100)}
                />{' '}
                {stringGetter({ key: STRING_KEYS.TRAIL })}
              </span>
            )}
          </TableCell>
        ),
      },
      [OrdersTableColumnKey.GoodTil]: {
        columnKey: 'expiresAtMilliseconds',
        getCellValue: (row) => row.expiresAtMilliseconds ?? Infinity,
        label: stringGetter({ key: STRING_KEYS.GOOD_TIL }),
        renderCell: ({ expiresAtMilliseconds }) => {
          if (!expiresAtMilliseconds) return <Output type={OutputType.Text} />;
          // TODO: use OutputType.RelativeTime when ready
          const { timeString, unitStringKey } = getStringsForDateTimeDiff(
            DateTime.fromMillis(expiresAtMilliseconds)
          );

          return (
            <Output
              type={OutputType.Text}
              value={`${timeString}${stringGetter({ key: unitStringKey })}`}
            />
          );
        },
      },
      [OrdersTableColumnKey.Actions]: {
        columnKey: 'cancelOrClear',
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        isActionable: true,
        allowsSorting: false,
        getCellValue: undefined,
        renderCell: ({ id, status, orderFlags }) => (
          <OrderActionsCell
            orderId={id}
            status={status}
            orderFlags={orderFlags}
            isDisabled={isAccountViewOnly}
          />
        ),
      },
      [OrdersTableColumnKey.StatusFill]: {
        columnKey: 'statusFill',
        getCellValue: (row) => row.status.name,
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
        renderCell: ({ asset, createdAtMilliseconds, size, status, totalFilled, resources }) => {
          const { statusIconColor } = getOrderStatusInfo({ status: status.rawValue });

          return (
            <TableCell
              stacked
              slotLeft={
                <>
                  <$TimeOutput
                    type={OutputType.RelativeTime}
                    relativeTimeFormatOptions={{ format: 'singleCharacter' }}
                    value={createdAtMilliseconds}
                  />
                  <$AssetIconWithStatus>
                    <$AssetIcon symbol={asset?.id} />
                    <$StatusDot color={statusIconColor} />
                  </$AssetIconWithStatus>
                </>
              }
            >
              <span>
                {resources.statusStringKey && stringGetter({ key: resources.statusStringKey })}
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
        getCellValue: (row) => row.price,
        renderCell: ({ price, orderSide, tickSizeDecimals, resources }) => (
          <TableCell stacked>
            <$InlineRow>
              <$Side side={orderSide}>
                {resources.sideStringKey ? stringGetter({ key: resources.sideStringKey }) : null}
              </$Side>
              <$SecondaryColor>@</$SecondaryColor>
              <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
            </$InlineRow>
            <span>
              {resources.typeStringKey ? stringGetter({ key: resources.typeStringKey }) : null}
            </span>
          </TableCell>
        ),
      },
    } satisfies Record<OrdersTableColumnKey, ColumnDef<OrderTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys: OrdersTableColumnKey[];
  columnWidths?: Partial<Record<OrdersTableColumnKey, ColumnSize>>;
  currentMarket?: string;
  initialPageSize?: PageSize;
};

type StyleProps = {
  withOuterBorder?: boolean;
};

export const OrdersTable = ({
  columnKeys = [],
  columnWidths,
  currentMarket,
  initialPageSize,
  withOuterBorder,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { isTablet } = useBreakpoints();

  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);
  const marketOrders = useSelector(getCurrentMarketOrders, shallowEqual) ?? EMPTY_ARR;
  const allOrders = useSelector(getSubaccountUnclearedOrders, shallowEqual) ?? EMPTY_ARR;
  const orders = currentMarket ? marketOrders : allOrders;

  const allPerpetualMarkets = orEmptyObj(useSelector(getPerpetualMarkets, shallowEqual));
  const allAssets = orEmptyObj(useSelector(getAssets, shallowEqual));

  const hasUnseenOrderUpdates = useSelector(getHasUnseenOrderUpdates);

  useEffect(() => {
    if (hasUnseenOrderUpdates) dispatch(viewedOrders());
  }, [hasUnseenOrderUpdates]);

  const symbol = currentMarket ? allAssets[allPerpetualMarkets[currentMarket]?.assetId]?.id : null;

  const ordersData = useMemo(
    () =>
      orders.map((order: SubaccountOrder) =>
        getHydratedTradingData({
          data: order,
          assets: allAssets,
          perpetualMarkets: allPerpetualMarkets,
        })
      ) as OrderTableRow[],
    [orders, allPerpetualMarkets, allAssets]
  );

  return (
    <$Table
      key={currentMarket ?? 'all-orders'}
      label="Orders"
      data={ordersData}
      getRowKey={(row: OrderTableRow) => row.id}
      getRowAttributes={(row: OrderTableRow) => ({
        'data-clearable': isOrderStatusClearable(row.status),
      })}
      onRowAction={(key: Key) =>
        dispatch(
          openDialog({
            type: DialogTypes.OrderDetails,
            dialogProps: { orderId: key },
          })
        )
      }
      columns={columnKeys.map((key: OrdersTableColumnKey) =>
        getOrdersTableColumnDef({
          key,
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
          <$EmptyIcon iconName={IconName.OrderPending} />
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
};
const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  tbody tr {
    &[data-clearable='true'] {
      opacity: 0.5;
    }
  }
` as typeof Table;

const $InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

const $AssetIcon = styled(AssetIcon)`
  font-size: 2rem;

  @media ${breakpoints.tablet} {
    font-size: 2.25rem;
  }
`;

const $TimeOutput = styled(Output)`
  color: var(--color-text-0);
`;

const $SecondaryColor = styled.span`
  color: var(--color-text-0);
`;

const $Side = styled.span<{ side: OrderSide }>`
  ${({ side }) =>
    ({
      [OrderSide.BUY]: css`
        color: var(--color-positive);
      `,
      [OrderSide.SELL]: css`
        color: var(--color-negative);
      `,
    }[side])};
`;

const $EmptyIcon = styled(Icon)`
  font-size: 3em;
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

const $WithTooltip = styled(WithTooltip)`
  --tooltip-backgroundColor: var(--color-layer-5);
`;
