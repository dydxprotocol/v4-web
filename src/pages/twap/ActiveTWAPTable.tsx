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
}: {
  key: ActiveTWAPTableColumnKey;
  stringGetter: ReturnType<typeof useStringGetter>;
  width?: ColumnSize;
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
          <TableCell stacked>
            <Output type={OutputType.Asset} value={totalFilled} fractionDigits={stepSizeDecimals} />
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
        renderCell: () => <$TerminateButton>Terminate</$TerminateButton>,
      },
    } satisfies Record<ActiveTWAPTableColumnKey, ColumnDef<ActiveTWAPOrderRow>>
  )[key],
});

export const ActiveTWAPTable = forwardRef(
  ({ columnKeys, columnWidths, initialPageSize }: ElementProps, _ref) => {
    const stringGetter = useStringGetter();
    const activeTWAPOrders = useAppSelector(BonsaiCore.account.activeTwapOrders.data);
    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

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
` as typeof Table;

const $TerminateButton = styled.button`
  color: var(--color-negative);
`;
