import { forwardRef, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { type PerpetualMarketSummary, type TWAPSubaccountOrder } from '@/bonsai/types/summaryTypes';
import type { ColumnSize } from '@react-types/table';
import { Duration } from 'luxon';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { defaultTableMixins } from '@/styles/tableMixins';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { type ColumnDef, Table } from '@/components/Table';
import { MarketSummaryTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { OrderStatusIconNew } from '@/views/OrderStatusIcon';

import { useAppSelector } from '@/state/appTypes';

import { getOrderStatusStringKey } from '@/lib/enumToStringKeyHelpers';
import { type Nullable, orEmptyRecord } from '@/lib/typeUtils';

type TWAPOrderHistoryRow = {
  marketSummary: Nullable<PerpetualMarketSummary>;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
} & TWAPSubaccountOrder;

export enum TWAPOrderHistoryTableColumnKey {
  OrderTime = 'Order Time',
  Market = 'Market',
  Execution = 'Executed / Total Size',
  AveragePrice = 'Average Price',
  Runtime = 'Runtime / Total',
  ReduceOnly = 'Reduce Only',
  Status = 'Status',
}

type ElementProps = {
  columnKeys: TWAPOrderHistoryTableColumnKey[];
  columnWidths?: Partial<Record<TWAPOrderHistoryTableColumnKey, ColumnSize>>;
  initialPageSize?: PageSize;
};

const getTWAPOrderHistoryTableColumnDef = ({
  key,
  stringGetter,
  width,
}: {
  key: TWAPOrderHistoryTableColumnKey;
  stringGetter: ReturnType<typeof useStringGetter>;
  width?: ColumnSize;
}): ColumnDef<TWAPOrderHistoryRow> => ({
  width,
  ...(
    {
      [TWAPOrderHistoryTableColumnKey.OrderTime]: {
        columnKey: 'updatedAtMilliseconds',
        getCellValue: (row) => row.updatedAtMilliseconds ?? 0,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        allowsSorting: true,
        renderCell: ({ updatedAtMilliseconds }) => {
          if (!updatedAtMilliseconds) return <Output type={OutputType.Text} />;

          return <Output type={OutputType.RelativeTime} value={updatedAtMilliseconds} />;
        },
      },
      [TWAPOrderHistoryTableColumnKey.Market]: {
        columnKey: 'marketId',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        allowsSorting: true,
        renderCell: ({ marketSummary }) => (
          <MarketSummaryTableCell marketSummary={marketSummary ?? undefined} />
        ),
      },
      [TWAPOrderHistoryTableColumnKey.Execution]: {
        columnKey: 'execution',
        getCellValue: (row) => row.totalFilled?.toNumber(),
        label: stringGetter({ key: STRING_KEYS.AMOUNT_FILLED }),
        allowsSorting: true,
        renderCell: ({ totalFilled, size, stepSizeDecimals }) => (
          <TableCell stacked>
            <Output type={OutputType.Asset} value={totalFilled} fractionDigits={stepSizeDecimals} />
            <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />
          </TableCell>
        ),
      },
      [TWAPOrderHistoryTableColumnKey.AveragePrice]: {
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
      [TWAPOrderHistoryTableColumnKey.Runtime]: {
        columnKey: 'runtime',
        label: stringGetter({ key: STRING_KEYS.RUNTIME_TOTAL }),
        allowsSorting: false,
        renderCell: ({ updatedAtMilliseconds, duration }) => {
          if (updatedAtMilliseconds == null || duration == null)
            return <Output type={OutputType.Text} />;

          const elapsedSeconds = Math.floor((Date.now() - updatedAtMilliseconds) / 1000);
          const durationSeconds = parseInt(duration, 10) || 0;
          const elapsed = Duration.fromObject({ seconds: elapsedSeconds })
            .rescale()
            .toHuman({ unitDisplay: 'narrow' });
          const total = Duration.fromObject({ seconds: durationSeconds })
            .rescale()
            .toHuman({ unitDisplay: 'narrow' });

          return (
            <TableCell stacked>
              <Output type={OutputType.Text} value={elapsed} />
              <Output type={OutputType.Text} value={total} />
            </TableCell>
          );
        },
      },
      [TWAPOrderHistoryTableColumnKey.ReduceOnly]: {
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
      [TWAPOrderHistoryTableColumnKey.Status]: {
        columnKey: 'status',
        getCellValue: (row) => row.status,
        label: stringGetter({ key: STRING_KEYS.STATUS }),
        allowsSorting: true,
        renderCell: ({ status }) => (
          <TableCell>
            {status != null && <OrderStatusIconNew status={status} />}
            {status != null ? stringGetter({ key: getOrderStatusStringKey(status) }) : null}
          </TableCell>
        ),
      },
    } satisfies Record<TWAPOrderHistoryTableColumnKey, ColumnDef<TWAPOrderHistoryRow>>
  )[key],
});

export const TWAPOrderHistoryTable = forwardRef(
  ({ columnKeys, columnWidths, initialPageSize }: ElementProps, _ref) => {
    const stringGetter = useStringGetter();
    const twapOrderHistory = useAppSelector(BonsaiCore.account.twapOrderHistory.data);
    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

    const twapOrdersData: TWAPOrderHistoryRow[] = useMemo(
      () =>
        twapOrderHistory.map((order) => ({
          ...order,
          marketSummary: marketSummaries[order.marketId],
          stepSizeDecimals: marketSummaries[order.marketId]?.stepSizeDecimals ?? TOKEN_DECIMALS,
          tickSizeDecimals: marketSummaries[order.marketId]?.tickSizeDecimals ?? USD_DECIMALS,
        })),
      [twapOrderHistory, marketSummaries]
    );

    return (
      <$Table
        key="twap-order-history"
        label="TWAP Order History"
        tableId="twap-order-history-table"
        data={twapOrdersData}
        getRowKey={(row: TWAPOrderHistoryRow) => row.id}
        columns={columnKeys.map((key) =>
          getTWAPOrderHistoryTableColumnDef({
            key,
            stringGetter,
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
        withInnerBorders
        withScrollSnapColumns
        withScrollSnapRows
        withFocusStickyRows
      />
    );
  }
);

const $Table = styled(Table)`
  ${defaultTableMixins}
` as typeof Table;
