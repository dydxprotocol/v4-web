import { useEffect, useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { ColumnSize } from '@react-types/table';
import type { Dispatch } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { Asset, Nullable, SubaccountOrder } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import {
  MarketTableCell,
  Table,
  TableCell,
  TableColumnHeader,
  type ColumnDef,
} from '@/components/Table';
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
  getStatusIconInfo,
  isMarketOrderType,
  isOrderStatusClearable,
} from '@/lib/orders';
import { getStringsForDateTimeDiff } from '@/lib/timeUtils';

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
  dispatch,
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
        renderCell: ({ status, totalFilled, resources }) => {
          const { statusIcon, statusIconColor, statusStringKey } = getStatusIconInfo({
            status,
            totalFilled,
          });

          return (
            <TableCell>
              <Styled.WithTooltip
                tooltipString={
                  statusStringKey
                    ? stringGetter({ key: statusStringKey })
                    : resources.statusStringKey
                    ? stringGetter({ key: resources.statusStringKey })
                    : undefined
                }
                side="right"
              >
                <Styled.StatusIcon iconName={statusIcon} color={statusIconColor} />
              </Styled.WithTooltip>
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
        renderCell: ({ type, triggerPrice, trailingPercent, tickSizeDecimals }) => (
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
        renderCell: ({ id, status }) => (
          <OrderActionsCell orderId={id} status={status} isDisabled={isAccountViewOnly} />
        ),
      },
      [OrdersTableColumnKey.StatusFill]: {
        columnKey: 'statusFill',
        getCellValue: (row) => row.status.name,
        label: `${stringGetter({ key: STRING_KEYS.STATUS })} / ${stringGetter({
          key: STRING_KEYS.FILL,
        })}`,
        renderCell: ({ asset, createdAtMilliseconds, size, status, totalFilled, resources }) => {
          const { statusIconColor, statusStringKey } = getStatusIconInfo({
            status,
            totalFilled,
          });

          return (
            <TableCell
              stacked
              slotLeft={
                <>
                  <Styled.TimeOutput
                    type={OutputType.RelativeTime}
                    relativeTimeFormatOptions={{ format: 'singleCharacter' }}
                    value={createdAtMilliseconds}
                  />
                  <Styled.AssetIconWithStatus>
                    <Styled.AssetIcon symbol={asset?.id} />
                    <Styled.StatusDot color={statusIconColor} />
                  </Styled.AssetIconWithStatus>
                </>
              }
            >
              <span>
                {statusStringKey
                  ? stringGetter({ key: statusStringKey })
                  : resources.statusStringKey && stringGetter({ key: resources.statusStringKey })}
              </span>
              <Styled.InlineRow>
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
              </Styled.InlineRow>
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
            <Styled.InlineRow>
              <Styled.Side side={orderSide}>
                {resources.sideStringKey ? stringGetter({ key: resources.sideStringKey }) : null}
              </Styled.Side>
              <Styled.SecondaryColor>@</Styled.SecondaryColor>
              <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
            </Styled.InlineRow>
            <span>
              {resources.typeStringKey ? stringGetter({ key: resources.typeStringKey }) : null}
            </span>
          </TableCell>
        ),
      },
    } as Record<OrdersTableColumnKey, ColumnDef<OrderTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys: OrdersTableColumnKey[];
  columnWidths?: Partial<Record<OrdersTableColumnKey, ColumnSize>>;
  currentMarket?: string;
};

type StyleProps = {
  withOuterBorder?: boolean;
};

export const OrdersTable = ({
  columnKeys = [],
  columnWidths,
  currentMarket,
  withOuterBorder,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { isTablet } = useBreakpoints();

  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);
  const marketOrders = useSelector(getCurrentMarketOrders, shallowEqual) || [];
  const allOrders = useSelector(getSubaccountUnclearedOrders, shallowEqual) || [];
  const orders = currentMarket ? marketOrders : allOrders;

  const allPerpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const allAssets = useSelector(getAssets, shallowEqual) || {};

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
    <Styled.Table
      key={currentMarket ?? 'all-orders'}
      label="Orders"
      data={ordersData}
      getRowKey={(row: OrderTableRow) => row.id}
      getRowAttributes={(row: OrderTableRow) => ({
        'data-clearable': isOrderStatusClearable(row.status),
      })}
      onRowAction={(key: string) =>
        dispatch(
          openDialog({
            type: DialogTypes.OrderDetails,
            dialogProps: { orderId: key },
          })
        )
      }
      columns={columnKeys.map((key: OrdersTableColumnKey, index: number) =>
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
          <Styled.EmptyIcon iconName={IconName.OrderPending} />
          <h4>{stringGetter({ key: STRING_KEYS.ORDERS_EMPTY_STATE })}</h4>
        </>
      }
      withOuterBorder={withOuterBorder}
      withInnerBorders
      withScrollSnapColumns
      withScrollSnapRows
      withFocusStickyRows
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  tbody tr {
    &[data-clearable='true'] {
      opacity: 0.5;
    }
  }
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.AssetIcon = styled(AssetIcon)`
  font-size: 2rem;

  @media ${breakpoints.tablet} {
    font-size: 2.25rem;
  }
`;

Styled.TimeOutput = styled(Output)`
  color: var(--color-text-0);
`;

Styled.SecondaryColor = styled.span`
  color: var(--color-text-0);
`;

Styled.Side = styled.span<{ side: OrderSide }>`
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

Styled.EmptyIcon = styled(Icon)`
  font-size: 3em;
`;

Styled.AssetIconWithStatus = styled.div`
  ${layoutMixins.stack}

  ${Styled.AssetIcon} {
    margin: 0.125rem;
  }
`;

Styled.StatusDot = styled.div<{ color: string }>`
  place-self: start end;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  border: 2px solid var(--tableRow-currentBackgroundColor);

  background-color: ${({ color }) => color};
`;

Styled.StatusIcon = styled(Icon)<{ color: string }>`
  color: ${({ color }) => color};
`;

Styled.WithTooltip = styled(WithTooltip)`
  --tooltip-backgroundColor: var(--color-layer-5);
`;
