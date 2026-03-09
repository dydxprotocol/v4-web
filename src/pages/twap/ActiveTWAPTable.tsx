import { forwardRef, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import {
  OrderStatus,
  type PerpetualMarketSummary,
  type TWAPSubaccountOrder,
} from '@/bonsai/types/summaryTypes';
import type { ColumnSize } from '@react-types/table';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { defaultTableMixins } from '@/styles/tableMixins';

import { Icon, IconName } from '@/components/Icon';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { type ColumnDef, Table } from '@/components/Table';
import {
  DateAgeModeProvider,
  DateAgeOutput,
  DateAgeToggleHeader,
} from '@/components/Table/DateAgeToggleHeader';
import { MarketSummaryTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { TagSize } from '@/components/Tag';
import { OrderActionsCell } from '@/views/tables/OrdersTable/OrderActionsCell';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { type Nullable, orEmptyRecord } from '@/lib/typeUtils';

type ActiveTWAPOrderRow = {
  marketSummary: Nullable<PerpetualMarketSummary>;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
} & TWAPSubaccountOrder;

export enum ActiveTWAPTableColumnKey {
  Market = 'Market',
  Side = 'Side',
  Execution = 'Executed / Total Size',
  AveragePrice = 'Average Price',
  Runtime = 'Runtime / Total',
  ReduceOnly = 'Reduce Only',
  OrderTime = 'Order Time',
  Terminate = '',
}

type ElementProps = {
  columnKeys: ActiveTWAPTableColumnKey[];
  columnWidths?: Partial<Record<ActiveTWAPTableColumnKey, ColumnSize>>;
  initialPageSize?: PageSize;
};

const getActiveTWAPTableColumnDef = ({
  key,
  stringGetter,
  width,
  isAccountViewOnly,
}: {
  key: ActiveTWAPTableColumnKey;
  stringGetter: ReturnType<typeof useStringGetter>;
  width?: ColumnSize;
  isAccountViewOnly: boolean;
}): ColumnDef<ActiveTWAPOrderRow> => ({
  width,
  ...(
    {
      [ActiveTWAPTableColumnKey.Market]: {
        columnKey: 'marketId',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        allowsSorting: true,
        renderCell: ({ marketSummary }) => (
          <MarketSummaryTableCell marketSummary={marketSummary ?? undefined} />
        ),
      },
      [ActiveTWAPTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.side,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        allowsSorting: true,
        renderCell: ({ side }) => <OrderSideTag orderSide={side} size={TagSize.Medium} />,
      },
      [ActiveTWAPTableColumnKey.Execution]: {
        columnKey: 'execution',
        getCellValue: (row) => row.totalFilled?.toNumber(),
        label: stringGetter({ key: STRING_KEYS.AMOUNT_FILLED }),
        allowsSorting: true,
        renderCell: ({ totalFilled, size, stepSizeDecimals }) => (
          <TableCell>
            <Output
              tw="text-color-positive"
              type={OutputType.Asset}
              value={totalFilled}
              fractionDigits={stepSizeDecimals}
            />
            <span tw="text-color-text-0">/</span>
            <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />
          </TableCell>
        ),
      },
      [ActiveTWAPTableColumnKey.AveragePrice]: {
        columnKey: 'price',
        getCellValue: (row) => row.price.toNumber(),
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        allowsSorting: true,
        renderCell: ({ price, tickSizeDecimals }) => (
          <Output
            withSubscript
            type={OutputType.Fiat}
            value={price}
            fractionDigits={tickSizeDecimals}
          />
        ),
      },
      [ActiveTWAPTableColumnKey.Runtime]: {
        columnKey: 'runtime',
        label: stringGetter({ key: STRING_KEYS.RUNTIME_TOTAL }),
        allowsSorting: false,
        renderCell: ({ createdAtMilliseconds, duration }) => {
          if (createdAtMilliseconds == null || duration == null)
            return <Output type={OutputType.Text} />;

          const elapsedRuntime = Date.now() - createdAtMilliseconds;
          const fullRuntime = parseInt(duration, 10) * 1000;

          return (
            <TableCell stacked>
              <Output type={OutputType.Duration} value={elapsedRuntime} />
              <Output type={OutputType.Duration} value={fullRuntime} />
            </TableCell>
          );
        },
      },
      [ActiveTWAPTableColumnKey.ReduceOnly]: {
        columnKey: 'reduceOnly',
        label: stringGetter({ key: STRING_KEYS.REDUCE_ONLY }),
        allowsSorting: false,
        renderCell: ({ reduceOnly }) => (
          <Output
            type={OutputType.Text}
            value={
              reduceOnly
                ? stringGetter({ key: STRING_KEYS.YES })
                : stringGetter({ key: STRING_KEYS.NO })
            }
          />
        ),
      },
      [ActiveTWAPTableColumnKey.OrderTime]: {
        columnKey: 'updatedAtMilliseconds',
        getCellValue: (row) => row.updatedAtMilliseconds ?? 0,
        label: <DateAgeToggleHeader />,
        allowsSorting: true,
        renderCell: ({ updatedAtMilliseconds }) => {
          if (updatedAtMilliseconds == null) return <Output type={OutputType.Text} />;

          return (
            <TableCell>
              <DateAgeOutput value={updatedAtMilliseconds} relativeTimeFormat="short" />
            </TableCell>
          );
        },
      },
      [ActiveTWAPTableColumnKey.Terminate]: {
        columnKey: 'terminate',
        label: '',
        allowsSorting: false,
        isActionable: true,
        renderCell: ({ id, status, orderFlags }) => {
          return (
            <OrderActionsCell
              orderId={id}
              status={status ?? OrderStatus.Open}
              orderFlags={orderFlags}
              isDisabled={isAccountViewOnly}
            />
          );
        },
      },
    } satisfies Record<ActiveTWAPTableColumnKey, ColumnDef<ActiveTWAPOrderRow>>
  )[key],
});

export const ActiveTWAPTable = forwardRef(
  ({ columnKeys, columnWidths, initialPageSize }: ElementProps, _ref) => {
    const stringGetter = useStringGetter();
    const activeTWAPOrders = useAppSelector(BonsaiCore.account.activeTwapOrders.data);
    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));
    const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

    const twapOrdersData: ActiveTWAPOrderRow[] = useMemo(
      () =>
        activeTWAPOrders.map((order) => ({
          ...order,
          marketSummary: marketSummaries[order.marketId],
          stepSizeDecimals: marketSummaries[order.marketId]?.stepSizeDecimals ?? TOKEN_DECIMALS,
          tickSizeDecimals: marketSummaries[order.marketId]?.tickSizeDecimals ?? USD_DECIMALS,
        })),
      [activeTWAPOrders, marketSummaries]
    );

    return (
      <DateAgeModeProvider>
        <$Table
          key="active-twap-orders"
          label={stringGetter({ key: STRING_KEYS.TWAP_ACTIVE_ORDERS })}
          tableId="active-twap-table"
          data={twapOrdersData}
          getRowKey={(row: ActiveTWAPOrderRow) => row.id}
          columns={columnKeys.map((key) =>
            getActiveTWAPTableColumnDef({
              key,
              stringGetter,
              width: columnWidths?.[key],
              isAccountViewOnly,
            })
          )}
          slotEmpty={
            <>
              <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
              <h4>{stringGetter({ key: STRING_KEYS.ORDERS_EMPTY_STATE })}</h4>
            </>
          }
          initialPageSize={initialPageSize}
          withInnerBorders
          withScrollSnapColumns
          withScrollSnapRows
          withFocusStickyRows
        />
      </DateAgeModeProvider>
    );
  }
);

const $Table = styled(Table)`
  ${defaultTableMixins}
  --color-border: var(--color-layer-4);
` as typeof Table;
