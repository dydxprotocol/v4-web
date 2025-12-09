import { useMemo } from 'react';

import { ColumnSize } from '@react-types/table';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { SMALL_USD_DECIMALS } from '@/constants/numbers';

import { defaultTableMixins } from '@/styles/tableMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';

export interface SpotPositionItem {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage?: string;
  holdingsAmount?: number;
  holdingsUsd?: number;
  boughtAmount?: number;
  boughtUsd?: number;
  soldAmount?: number;
  soldUsd?: number;
  pnlUsd?: number;
  avgEntryUsd?: number;
}

export enum SpotHoldingsTableColumnKey {
  Token = 'Token',
  Holdings = 'Holdings',
  Bought = 'Bought',
  Sold = 'Sold',
  PnL = 'PnL',
  TpSl = 'TpSl',
  Actions = 'Actions',
  AvgEntry = 'AvgEntry',
}

// TODO: spot localization

const getColumnDef = ({
  key,
  width,
  onSellAction,
}: {
  key: SpotHoldingsTableColumnKey;
  width?: ColumnSize;
  onSellAction?: (row: SpotPositionItem) => void;
}): ColumnDef<SpotPositionItem> => ({
  width,
  ...(
    {
      [SpotHoldingsTableColumnKey.Token]: {
        columnKey: 'token',
        label: 'Token',
        getCellValue: (row) => row.tokenSymbol,
        renderCell: ({ tokenImage, tokenSymbol }) => (
          <TableCell
            slotLeft={
              <AssetIcon
                logoUrl={tokenImage}
                symbol={tokenSymbol}
                tw="[--asset-icon-size:1.25rem]"
              />
            }
          >
            <span tw="font-bold">{tokenSymbol}</span>
          </TableCell>
        ),
      },
      [SpotHoldingsTableColumnKey.Holdings]: {
        columnKey: 'holdingsUsd',
        label: 'Holdings',
        getCellValue: (row) => row.holdingsUsd ?? 0,
        renderCell: ({ holdingsUsd, holdingsAmount, tokenName }) => (
          <TableCell stacked>
            <Output type={OutputType.Fiat} value={holdingsUsd} />
            {holdingsAmount != null && (
              <span tw="inlineRow">
                <Output type={OutputType.CompactNumber} value={holdingsAmount} />
                {tokenName}
              </span>
            )}
          </TableCell>
        ),
      },
      [SpotHoldingsTableColumnKey.Bought]: {
        columnKey: 'boughtUsd',
        label: 'Bought',
        getCellValue: (row) => row.boughtUsd ?? 0,
        renderCell: ({ boughtUsd, boughtAmount, tokenName }) => (
          <TableCell stacked>
            <Output type={OutputType.Fiat} value={boughtUsd} />
            {boughtAmount != null && (
              <span tw="inlineRow">
                <Output type={OutputType.CompactNumber} value={boughtAmount} />
                {tokenName}
              </span>
            )}
          </TableCell>
        ),
      },
      [SpotHoldingsTableColumnKey.Sold]: {
        columnKey: 'soldUsd',
        label: 'Sold',
        getCellValue: (row) => row.soldUsd ?? 0,
        renderCell: ({ soldUsd, soldAmount, tokenName }) => (
          <TableCell stacked>
            <Output type={OutputType.Fiat} value={soldUsd} />
            {soldAmount != null && (
              <span tw="inlineRow">
                <Output type={OutputType.CompactNumber} value={soldAmount} />
                {tokenName}
              </span>
            )}
          </TableCell>
        ),
      },
      [SpotHoldingsTableColumnKey.AvgEntry]: {
        columnKey: 'avgEntry',
        label: 'Avg Entry',
        getCellValue: (row) => row.avgEntryUsd ?? 0,
        renderCell: ({ avgEntryUsd }) => (
          <TableCell>
            <Output
              type={OutputType.Fiat}
              value={avgEntryUsd}
              minimumFractionDigits={SMALL_USD_DECIMALS}
            />
          </TableCell>
        ),
      },
      [SpotHoldingsTableColumnKey.PnL]: {
        columnKey: 'pnlUsd',
        label: 'PNL',
        getCellValue: (row) => row.pnlUsd ?? 0,
        renderCell: ({ pnlUsd }) => (
          <TableCell>
            <Output
              type={OutputType.Fiat}
              value={pnlUsd}
              showSign={ShowSign.Both}
              withSignedValueColor
            />
          </TableCell>
        ),
      },
      [SpotHoldingsTableColumnKey.TpSl]: {
        columnKey: 'tpsl',
        label: 'TP/SL',
        allowsSorting: false,
        renderCell: () => <TableCell>-</TableCell>,
      },
      [SpotHoldingsTableColumnKey.Actions]: {
        columnKey: 'actions',
        label: 'Actions',
        allowsSorting: false,
        isActionable: true,
        renderCell: (row) => (
          <TableCell>
            <Button
              action={ButtonAction.Reset}
              buttonStyle={ButtonStyle.Default}
              size={ButtonSize.XSmall}
              onClick={() => onSellAction?.(row)}
            >
              Sell
            </Button>
          </TableCell>
        ),
      },
    } satisfies Record<SpotHoldingsTableColumnKey, ColumnDef<SpotPositionItem>>
  )[key],
});

export type SpotHoldingsTableProps = {
  data: SpotPositionItem[];
  columnKeys?: SpotHoldingsTableColumnKey[];
  columnWidths?: Partial<Record<SpotHoldingsTableColumnKey, ColumnSize>>;
  onRowAction?: (row: SpotPositionItem) => void;
  onSellAction?: (row: SpotPositionItem) => void;
};

export const SpotHoldingsTable = ({
  data,
  columnKeys = [
    SpotHoldingsTableColumnKey.Token,
    SpotHoldingsTableColumnKey.Holdings,
    SpotHoldingsTableColumnKey.Bought,
    SpotHoldingsTableColumnKey.Sold,
    SpotHoldingsTableColumnKey.AvgEntry,
    SpotHoldingsTableColumnKey.PnL,
    SpotHoldingsTableColumnKey.Actions,
  ],
  columnWidths,
  onRowAction,
  onSellAction,
}: SpotHoldingsTableProps) => {
  const columns = useMemo(
    () => columnKeys.map((key) => getColumnDef({ key, width: columnWidths?.[key], onSellAction })),
    [columnKeys, columnWidths, onSellAction]
  );

  return (
    <$Table
      tableId="spot-holdings"
      data={data}
      getRowKey={(row) => row.tokenAddress}
      onRowAction={(_, row) => {
        onRowAction?.(row);
      }}
      columns={columns}
      paginationBehavior="showAll"
      withInnerBorders
      withScrollSnapColumns
      withScrollSnapRows
      slotEmpty={
        <>
          <Icon iconName={IconName.Positions} tw="text-[3em]" />
          <h4>Holdings are empty...</h4>
        </>
      }
    />
  );
};

const $Table = styled(Table)`
  ${defaultTableMixins}
` as typeof Table;
