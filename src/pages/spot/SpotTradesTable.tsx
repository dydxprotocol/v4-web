import { useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { ColumnSize } from '@react-types/table';
import styled from 'styled-components';

import { ButtonStyle, ButtonType } from '@/constants/buttons';

import { defaultTableMixins } from '@/styles/tableMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { TagSize } from '@/components/Tag';

export interface SpotTradeItem {
  id: string;
  side: 'buy' | 'sell';
  tokenAmount: number;
  usdValue: number;
  txHash: string;
  createdAt: string;
  tokenSymbol?: string;
  tokenImage?: string;
  marketCapUsd?: number;
}

export enum SpotTradesTableColumnKey {
  Time = 'Time',
  Token = 'Token',
  Type = 'Type',
  MarketCap = 'MarketCap',
  Amount = 'Amount',
  UsdAmount = 'UsdAmount',
  ViewTxn = 'ViewTxn',
}

// TODO: spot localization

const getColumnDef = ({
  key,
  width,
}: {
  key: SpotTradesTableColumnKey;
  width?: ColumnSize;
}): ColumnDef<SpotTradeItem> => ({
  width,
  ...(
    {
      [SpotTradesTableColumnKey.Time]: {
        columnKey: 'time',
        label: 'Time',
        getCellValue: (row) => row.createdAt,
        renderCell: ({ createdAt }) => (
          <TableCell>
            <Output type={OutputType.RelativeTime} value={createdAt} tw="text-color-text-0" />
          </TableCell>
        ),
      },
      [SpotTradesTableColumnKey.Token]: {
        columnKey: 'token',
        label: 'Token',
        getCellValue: (row) => row.tokenSymbol,
        renderCell: ({ tokenSymbol, tokenImage }) => (
          <TableCell
            slotLeft={
              <AssetIcon
                logoUrl={tokenImage}
                symbol={tokenSymbol}
                tw="[--asset-icon-size:1.25rem]"
              />
            }
          >
            <span tw="font-bold">{tokenSymbol ?? 'Unknown'}</span>
          </TableCell>
        ),
      },
      [SpotTradesTableColumnKey.Type]: {
        columnKey: 'side',
        label: 'Type',
        getCellValue: (row) => row.side,
        renderCell: ({ side }) => (
          <TableCell>
            <OrderSideTag
              orderSide={side === 'buy' ? OrderSide.BUY : OrderSide.SELL}
              size={TagSize.Medium}
            />
          </TableCell>
        ),
      },
      [SpotTradesTableColumnKey.MarketCap]: {
        columnKey: 'marketCapUsd',
        label: 'Market Cap',
        getCellValue: (row) => row.marketCapUsd ?? 0,
        renderCell: ({ marketCapUsd }) => (
          <TableCell>
            <Output type={OutputType.CompactFiat} value={marketCapUsd} />
          </TableCell>
        ),
      },
      [SpotTradesTableColumnKey.Amount]: {
        columnKey: 'tokenAmount',
        label: 'Amount',
        getCellValue: (row) => row.tokenAmount,
        renderCell: ({ tokenAmount, tokenSymbol }) => (
          <TableCell>
            <Output
              type={OutputType.CompactNumber}
              value={tokenAmount}
              slotRight={` ${tokenSymbol ?? ''}`}
            />
          </TableCell>
        ),
      },
      [SpotTradesTableColumnKey.UsdAmount]: {
        columnKey: 'usdValue',
        label: 'USD Amount',
        getCellValue: (row) => row.usdValue,
        renderCell: ({ usdValue }) => (
          <TableCell>
            <Output type={OutputType.Fiat} value={usdValue} />
          </TableCell>
        ),
      },
      [SpotTradesTableColumnKey.ViewTxn]: {
        columnKey: 'txHash',
        label: 'View Txn',
        allowsSorting: false,
        isActionable: true,
        renderCell: ({ txHash }) => (
          <TableCell>
            <IconButton
              iconName={IconName.LinkOut}
              buttonStyle={ButtonStyle.WithoutBackground}
              href={`https://solscan.io/tx/${txHash}`}
              type={ButtonType.Link}
            />
          </TableCell>
        ),
      },
    } satisfies Record<SpotTradesTableColumnKey, ColumnDef<SpotTradeItem>>
  )[key],
});

export type SpotTradesTableProps = {
  data: SpotTradeItem[];
  columnKeys?: SpotTradesTableColumnKey[];
  columnWidths?: Partial<Record<SpotTradesTableColumnKey, ColumnSize>>;
};

export const SpotTradesTable = ({
  data,
  columnKeys = [
    SpotTradesTableColumnKey.Time,
    SpotTradesTableColumnKey.Token,
    SpotTradesTableColumnKey.Type,
    SpotTradesTableColumnKey.MarketCap,
    SpotTradesTableColumnKey.Amount,
    SpotTradesTableColumnKey.UsdAmount,
    SpotTradesTableColumnKey.ViewTxn,
  ],
  columnWidths,
}: SpotTradesTableProps) => {
  const columns = useMemo(
    () => columnKeys.map((key) => getColumnDef({ key, width: columnWidths?.[key] })),
    [columnKeys, columnWidths]
  );

  return (
    <$Table
      defaultSortDescriptor={{
        column: 'time',
        direction: 'descending',
      }}
      tableId="spot-trades"
      data={data}
      getRowKey={(row) => row.id}
      columns={columns}
      initialPageSize={20}
      paginationBehavior="paginate"
      withInnerBorders
      withScrollSnapColumns
      withScrollSnapRows
      slotEmpty={
        <>
          <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
          <h4>No trades yet...</h4>
        </>
      }
    />
  );
};

const $Table = styled(Table)`
  ${defaultTableMixins}
` as typeof Table;
