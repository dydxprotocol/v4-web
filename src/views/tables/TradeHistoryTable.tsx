import { forwardRef, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { PerpetualMarketSummary, SubaccountTrade } from '@/bonsai/types/summaryTypes';
import type { ColumnSize } from '@react-types/table';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';

import { defaultTableMixins } from '@/styles/tableMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { DateAgeOutput } from '@/components/Table/DateAgeToggleHeader';
import { MarketSummaryTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { Tag } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { getMarginModeStringKey } from '@/lib/enumToStringKeyHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { getTradeActionDisplayInfo } from '@/lib/tradeHistoryHelpers';
import { Nullable, orEmptyRecord } from '@/lib/typeUtils';

import { TradeHistoryActionsCell } from './TradeHistoryTable/TradeHistoryActionsCell';

export enum TradeHistoryTableColumnKey {
  Time = 'Time',
  Market = 'Market',
  Type = 'Type',
  Action = 'Action',
  Price = 'Price',
  Size = 'Size',
  Value = 'Value',
  Fee = 'Fee',
  ClosedPnl = 'ClosedPnl',
  Actions = 'Actions',

  // Tablet (stacked)
  ActionAmount = 'Action-Amount',
  PriceFee = 'Price-Fee',
}

export type TradeTableRow = {
  marketSummary: Nullable<PerpetualMarketSummary>;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
} & SubaccountTrade;

const getTradeHistoryTableColumnDef = ({
  key,
  stringGetter,
  width,
}: {
  key: TradeHistoryTableColumnKey;
  stringGetter: StringGetterFunction;
  symbol?: Nullable<string>;
  width?: ColumnSize;
}): ColumnDef<TradeTableRow> => ({
  width,
  ...(
    {
      [TradeHistoryTableColumnKey.Time]: {
        columnKey: 'time',
        getCellValue: (row) => row.createdAt,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        renderCell: ({ createdAt }) => (
          <DateAgeOutput
            value={createdAt != null ? new Date(createdAt).getTime() : null}
            relativeTimeFormat="singleCharacter"
          />
        ),
      },

      [TradeHistoryTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ marketSummary }) => (
          <MarketSummaryTableCell marketSummary={marketSummary ?? undefined} />
        ),
      },

      [TradeHistoryTableColumnKey.Type]: {
        columnKey: 'type',
        getCellValue: (row) => row.marginMode,
        label: stringGetter({ key: STRING_KEYS.TYPE }),
        renderCell: ({ marginMode }) => (
          <TableCell>
            <Tag>{stringGetter({ key: getMarginModeStringKey(marginMode) })}</Tag>
          </TableCell>
        ),
      },

      [TradeHistoryTableColumnKey.Action]: {
        columnKey: 'action',
        getCellValue: (row) => row.action,
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        renderCell: ({ action }) => {
          const { label, color } = getTradeActionDisplayInfo(action, stringGetter);
          return <span css={{ color }}>{label}</span>;
        },
      },

      [TradeHistoryTableColumnKey.Price]: {
        columnKey: 'price',
        getCellValue: (row) => row.price,
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        renderCell: ({ price, tickSizeDecimals }) => (
          <Output
            withSubscript
            type={OutputType.Fiat}
            value={price}
            fractionDigits={tickSizeDecimals}
          />
        ),
      },

      [TradeHistoryTableColumnKey.Size]: {
        columnKey: 'size',
        getCellValue: (row) => row.additionalSize,
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        renderCell: ({ additionalSize, stepSizeDecimals }) => (
          <Output
            type={OutputType.Asset}
            value={Math.abs(Number(additionalSize))}
            fractionDigits={stepSizeDecimals}
          />
        ),
      },

      [TradeHistoryTableColumnKey.Value]: {
        columnKey: 'total',
        getCellValue: (row) => row.value,
        label: stringGetter({ key: STRING_KEYS.TOTAL }),
        renderCell: ({ value }) => (
          <TableCell>
            <Output type={OutputType.Fiat} value={value} />
          </TableCell>
        ),
      },

      [TradeHistoryTableColumnKey.Fee]: {
        columnKey: 'fee',
        getCellValue: (row) => row.fee,
        label: stringGetter({ key: STRING_KEYS.FEE }),
        renderCell: ({ fee }) => (
          <TableCell>
            <Output type={OutputType.Fiat} value={fee} />
          </TableCell>
        ),
      },

      [TradeHistoryTableColumnKey.ClosedPnl]: {
        columnKey: 'closedPnl',
        getCellValue: (row) => row.closedPnl,
        label: stringGetter({ key: STRING_KEYS.CLOSED_PNL }),
        renderCell: ({ closedPnl, netClosedPnlPercent }) => (
          <TableCell>
            {closedPnl != null && closedPnl !== 0 ? (
              <>
                <Output
                  type={OutputType.Fiat}
                  value={closedPnl}
                  showSign={ShowSign.Both}
                  withSignedValueColor
                />
                <$HighlightOutput
                  isNegative={MustBigNumber(netClosedPnlPercent).isNegative()}
                  type={OutputType.Percent}
                  value={netClosedPnlPercent}
                  showSign={ShowSign.Both}
                  withParentheses
                  withSignedValueColor
                />
              </>
            ) : (
              <span tw="text-color-text-0">—</span>
            )}
          </TableCell>
        ),
      },

      // --- Tablet stacked columns ---
      [TradeHistoryTableColumnKey.ActionAmount]: {
        columnKey: 'actionAmount',
        getCellValue: (row) => row.size,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.ACTION })}</span>
            <span>{stringGetter({ key: STRING_KEYS.AMOUNT })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ action, size, stepSizeDecimals, marketSummary }) => {
          const { label, color } = getTradeActionDisplayInfo(action, stringGetter);
          return (
            <TableCell
              stacked
              slotLeft={
                <AssetIcon
                  logoUrl={marketSummary?.logo}
                  symbol={marketSummary?.assetId}
                  tw="[--asset-icon-size:2.25rem]"
                />
              }
            >
              <span css={{ color }}>{label}</span>
              <Output
                type={OutputType.Asset}
                value={size}
                fractionDigits={stepSizeDecimals}
                tag={marketSummary?.displayableAsset}
              />
            </TableCell>
          );
        },
      },

      [TradeHistoryTableColumnKey.PriceFee]: {
        columnKey: 'priceFee',
        getCellValue: (row) => row.price,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.PRICE })}</span>
            <span>{stringGetter({ key: STRING_KEYS.FEE })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ side, price, fee, tickSizeDecimals }) => (
          <TableCell stacked>
            <$InlineRow>
              <$Side side={side}>{side === IndexerOrderSide.BUY ? 'Buy' : 'Sell'}</$Side>
              <span tw="text-color-text-0">@</span>
              <Output
                withSubscript
                type={OutputType.Fiat}
                value={price}
                fractionDigits={tickSizeDecimals}
              />
            </$InlineRow>
            <Output type={OutputType.Fiat} value={fee} />
          </TableCell>
        ),
      },

      [TradeHistoryTableColumnKey.Actions]: {
        columnKey: 'actions',
        isActionable: true,
        allowsSorting: false,
        label: stringGetter({ key: STRING_KEYS.SHARE }),
        renderCell: (row) => <TradeHistoryActionsCell trade={row} />,
      },
    } satisfies Record<TradeHistoryTableColumnKey, ColumnDef<TradeTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys: TradeHistoryTableColumnKey[];
  columnWidths?: Partial<Record<TradeHistoryTableColumnKey, ColumnSize>>;
  initialPageSize?: PageSize;
};

type StyleProps = {
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
};

export const TradeHistoryTable = forwardRef(
  (
    {
      columnKeys,
      columnWidths,
      initialPageSize,
      withOuterBorder,
      withInnerBorders = true,
    }: ElementProps & StyleProps,
    _ref
  ) => {
    const stringGetter = useStringGetter();
    const allTrades = useAppSelector(BonsaiCore.account.tradeHistory.data);
    const tradesStatus = useAppSelector(BonsaiCore.account.tradeHistory.loading);
    const isError = tradesStatus === 'error';
    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

    const tradesData = useMemo(
      () =>
        allTrades.map(
          (trade: SubaccountTrade): TradeTableRow => ({
            ...trade,
            marketSummary: marketSummaries[trade.marketId] ?? null,
            stepSizeDecimals: marketSummaries[trade.marketId]?.stepSizeDecimals ?? 2,
            tickSizeDecimals: marketSummaries[trade.marketId]?.tickSizeDecimals ?? 2,
          })
        ),
      [allTrades, marketSummaries]
    );

    return (
      <$Table
        key="trade-history"
        label="Trades"
        tableId="tradeHistory"
        data={tradesData}
        getRowKey={(row: TradeTableRow) => row.id}
        columns={columnKeys.map((key: TradeHistoryTableColumnKey) =>
          getTradeHistoryTableColumnDef({
            key,
            stringGetter,
            width: columnWidths?.[key],
          })
        )}
        slotEmpty={
          isError ? (
            <>
              <Icon iconName={IconName.ErrorExclamation} tw="text-[3em]" />
              <h4>
                {stringGetter({
                  key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
                  params: { ERROR_MESSAGE: 'Failed to load trades' },
                })}
              </h4>
            </>
          ) : (
            <>
              <Icon iconName={IconName.History} tw="text-[3em]" />
              <h4>{stringGetter({ key: STRING_KEYS.TRADES_EMPTY_STATE })}</h4>
            </>
          )
        }
        initialPageSize={initialPageSize}
        withOuterBorder={withOuterBorder}
        withInnerBorders={withInnerBorders}
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
const $InlineRow = tw.div`inlineRow`;
const $Side = styled.span<{ side: Nullable<IndexerOrderSide> }>`
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

const $HighlightOutput = styled(Output)<{ isNegative?: boolean }>`
  color: var(--color-text-1);
  --secondary-item-color: currentColor;
  --output-sign-color: ${({ isNegative }) =>
    isNegative !== undefined
      ? isNegative
        ? `var(--color-negative)`
        : `var(--color-positive)`
      : `currentColor`};
`;
