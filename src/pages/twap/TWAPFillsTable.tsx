import { forwardRef, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { type PerpetualMarketSummary, type SubaccountFill } from '@/bonsai/types/summaryTypes';
import type { ColumnSize } from '@react-types/table';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

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

import { MustBigNumber } from '@/lib/numbers';
import { getHydratedFill } from '@/lib/orders';
import { type Nullable, orEmptyRecord } from '@/lib/typeUtils';

type TWAPFillRow = {
  marketSummary: Nullable<PerpetualMarketSummary>;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
} & SubaccountFill;

export enum TWAPFillsTableColumnKey {
  OrderTime = 'Order Time',
  Market = 'Market',
  Side = 'Side',
  AveragePrice = 'Average Price',
  Size = 'Size',
  TradeValue = 'Trade Value',
  Fee = 'Fee',
  PnL = 'P&L',
}

type ElementProps = {
  columnKeys: TWAPFillsTableColumnKey[];
  columnWidths?: Partial<Record<TWAPFillsTableColumnKey, ColumnSize>>;
  initialPageSize?: PageSize;
};

const getTWAPFillsTableColumnDef = ({
  key,
  stringGetter,
  width,
}: {
  key: TWAPFillsTableColumnKey;
  stringGetter: ReturnType<typeof useStringGetter>;
  width?: ColumnSize;
}): ColumnDef<TWAPFillRow> => ({
  width,
  ...(
    {
      [TWAPFillsTableColumnKey.OrderTime]: {
        columnKey: 'time',
        getCellValue: (row) => row.createdAt,
        label: <DateAgeToggleHeader />,
        allowsSorting: true,
        renderCell: ({ createdAt }) => (
          <TableCell>
            <DateAgeOutput
              value={createdAt != null ? new Date(createdAt).getTime() : null}
              relativeTimeFormat="short"
            />
          </TableCell>
        ),
      },
      [TWAPFillsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.market,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        allowsSorting: true,
        renderCell: ({ marketSummary }) => (
          <MarketSummaryTableCell marketSummary={marketSummary ?? undefined} />
        ),
      },
      [TWAPFillsTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.side,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        allowsSorting: true,
        renderCell: ({ side }) => side && <OrderSideTag orderSide={side} size={TagSize.Medium} />,
      },
      [TWAPFillsTableColumnKey.AveragePrice]: {
        columnKey: 'price',
        getCellValue: (row) => row.price,
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
      [TWAPFillsTableColumnKey.Size]: {
        columnKey: 'size',
        getCellValue: (row) => row.size,
        label: stringGetter({ key: STRING_KEYS.SIZE }),
        allowsSorting: true,
        renderCell: ({ size, stepSizeDecimals }) => (
          <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />
        ),
      },
      [TWAPFillsTableColumnKey.TradeValue]: {
        columnKey: 'tradeValue',
        getCellValue: (row) =>
          MustBigNumber(row.price)
            .times(row.size ?? 0)
            .toNumber(),
        label: stringGetter({ key: STRING_KEYS.TOTAL }),
        allowsSorting: true,
        renderCell: ({ size, price }) => {
          if (size == null || price == null) return <Output type={OutputType.Text} />;

          return (
            <TableCell>
              <Output type={OutputType.Fiat} value={MustBigNumber(price).times(size)} />
            </TableCell>
          );
        },
      },
      [TWAPFillsTableColumnKey.Fee]: {
        columnKey: 'fee',
        getCellValue: (row) => row.fee,
        label: stringGetter({ key: STRING_KEYS.FEE }),
        allowsSorting: true,
        renderCell: ({ fee }) => (
          <TableCell>
            <Output type={OutputType.Fiat} value={fee} />
          </TableCell>
        ),
      },
      [TWAPFillsTableColumnKey.PnL]: {
        columnKey: 'closedPnl',
        getCellValue: (row) => row.closedPnl,
        label: stringGetter({ key: STRING_KEYS.PNL }),
        allowsSorting: true,
        renderCell: ({ closedPnl }) => (
          <TableCell>
            <Output type={OutputType.Fiat} value={closedPnl} />
          </TableCell>
        ),
      },
    } satisfies Record<TWAPFillsTableColumnKey, ColumnDef<TWAPFillRow>>
  )[key],
});

export const TWAPFillsTable = forwardRef(
  ({ columnKeys, columnWidths, initialPageSize }: ElementProps, _ref) => {
    const stringGetter = useStringGetter();
    const twapFills = useAppSelector(BonsaiCore.account.twapFills.data);
    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

    const fillsData: TWAPFillRow[] = useMemo(
      () =>
        twapFills.map((fill) =>
          getHydratedFill({
            data: fill,
            marketSummaries,
          })
        ),
      [twapFills, marketSummaries]
    );

    return (
      <DateAgeModeProvider>
        <$Table
          key="twap-fills"
          label={stringGetter({ key: STRING_KEYS.TWAP_FILLS })}
          tableId="twap-fills-table"
          data={fillsData}
          getRowKey={(row: TWAPFillRow, rowIdx?: number) => row.id ?? rowIdx ?? ''}
          columns={columnKeys.map((key) =>
            getTWAPFillsTableColumnDef({
              key,
              stringGetter,
              width: columnWidths?.[key],
            })
          )}
          slotEmpty={
            <>
              <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
              <h4>{stringGetter({ key: STRING_KEYS.TRADES_EMPTY_STATE })}</h4>
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
