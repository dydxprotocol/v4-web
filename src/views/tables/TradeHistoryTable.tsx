import { forwardRef, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import {
  PerpetualMarketSummary,
  SubaccountFillType,
  SubaccountTrade,
  TradeAction,
} from '@/bonsai/types/summaryTypes';
import type { ColumnSize } from '@react-types/table';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';

import { defaultTableMixins } from '@/styles/tableMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
// import { MarketSummaryTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { Tag } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { getMarginModeStringKey } from '@/lib/enumToStringKeyHelpers';
import { getNumberSign, MustBigNumber } from '@/lib/numbers';
// import { MustBigNumber } from '@/lib/numbers';
import { Nullable, orEmptyRecord } from '@/lib/typeUtils';

import { TradeHistoryActionsCell } from './TradeHistoryTable/TradeHistoryActionsCell';

export enum TradeHistoryTableColumnKey {
  Time = 'Time',
  Market = 'Market',
  Leverage = 'Leverage',
  Type = 'Type',
  Action = 'Action',
  Side = 'Side',
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

function getActionDisplayInfo(action: TradeAction) {
  switch (action) {
    case TradeAction.OPEN_LONG:
      return { label: 'Open Long', color: 'var(--color-positive)' };
    case TradeAction.OPEN_SHORT:
      return { label: 'Open Short', color: 'var(--color-negative)' };
    case TradeAction.CLOSE_LONG:
      return { label: 'Close Long', color: 'var(--color-negative)' };
    case TradeAction.CLOSE_SHORT:
      return { label: 'Close Short', color: 'var(--color-positive)' };
    case TradeAction.PARTIAL_CLOSE_LONG:
      return { label: 'Partial Close Long', color: 'var(--color-negative)' };
    case TradeAction.PARTIAL_CLOSE_SHORT:
      return { label: 'Partial Close Short', color: 'var(--color-positive)' };
    case TradeAction.ADD_TO_LONG:
      return { label: 'Add to Long', color: 'var(--color-positive)' };
    case TradeAction.ADD_TO_SHORT:
      return { label: 'Add to Short', color: 'var(--color-negative)' };
    default:
      return { label: '', color: 'var(--color-text-0)' };
  }
}

const getTradeHistoryTableColumnDef = ({
  key,
  stringGetter,
  symbol = '',
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
          <Output
            type={OutputType.RelativeTime}
            relativeTimeOptions={{ format: 'singleCharacter' }}
            value={createdAt != null ? new Date(createdAt).getTime() : undefined}
            tw="text-color-text-0"
          />
        ),
      },

      [TradeHistoryTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ marketSummary }) => (
          <TableCell
            slotLeft={
              <AssetIcon
                logoUrl={marketSummary?.logo}
                symbol={marketSummary?.assetId}
                tw="[--asset-icon-size:1.25rem]"
              />
            }
          >
            <span tw="font-bold text-color-text-2">{marketSummary?.displayableAsset ?? ''}</span>
          </TableCell>
        ),
      },

      [TradeHistoryTableColumnKey.Leverage]: {
        columnKey: 'leverage',
        getCellValue: (row) => row.leverage,
        label: stringGetter({ key: STRING_KEYS.LEVERAGE }),
        renderCell: ({ leverage, positionSide }) => (
          <TableCell>
            <$OutputSigned
              sign={getNumberSign(
                positionSide === IndexerPositionSide.SHORT ? -1 * (leverage ?? 0) : (leverage ?? 0)
              )}
              type={OutputType.Multiple}
              value={leverage}
              showSign={ShowSign.None}
            />
          </TableCell>
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
          const { label, color } = getActionDisplayInfo(action);
          return <span css={{ color }}>{label}</span>;
        },
      },

      [TradeHistoryTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.side,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ side }) =>
          side != null ? (
            <$Side side={side}>{side === IndexerOrderSide.BUY ? 'Buy' : 'Sell'}</$Side>
          ) : null,
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
        getCellValue: (row) => row.size,
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        tag: symbol,
        renderCell: ({ size, stepSizeDecimals }) => (
          <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />
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
        label: stringGetter({ key: STRING_KEYS.PNL }),
        renderCell: ({ closedPnl, closedPnlPercent }) => (
          <TableCell>
            {closedPnl != null ? (
              <>
                <Output
                  type={OutputType.Fiat}
                  value={closedPnl}
                  showSign={ShowSign.Both}
                  withSignedValueColor
                />
                <$HighlightOutput
                  isNegative={MustBigNumber(closedPnlPercent).isNegative()}
                  type={OutputType.Percent}
                  value={closedPnlPercent}
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
          const { label, color } = getActionDisplayInfo(action);
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

    const allTrades = MOCK_TRADES; // useAppSelector(BonsaiCore.account.trades.data);
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
        key="all-trades"
        label="Trades"
        tableId="trades"
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
          <>
            <Icon iconName={IconName.History} tw="text-[3em]" />
            <h4>{stringGetter({ key: STRING_KEYS.TRADES_EMPTY_STATE })}</h4>
          </>
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

const MOCK_TRADES: SubaccountTrade[] = [
  // --- L → Close scenario ---
  {
    id: 'trade-001',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.CLOSE_LONG,
    price: '5000.00',
    size: '10.05',
    prevSize: '0.00',
    additionalSize: '10.05',
    value: 50250,
    fee: '0.10',
    closedPnl: 20293.09,
    closedPnlPercent: 0.404,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
  {
    id: 'trade-002',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.05',
    prevSize: '0.00',
    additionalSize: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
  // --- L → S (crossing 0) scenario ---
  {
    id: 'trade-003',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.SHORT,
    action: TradeAction.OPEN_SHORT,
    price: '3000.00',
    size: '10.05',
    prevSize: '0.00',
    additionalSize: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
  {
    id: 'trade-004',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.CLOSE_LONG,
    price: '3000.00',
    size: '10.05',
    prevSize: '0.00',
    additionalSize: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: -20293.09,
    closedPnlPercent: -0.4469,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
    entryPrice: 5000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
  {
    id: 'trade-005',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.05',
    prevSize: '0.00',
    additionalSize: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
  // --- L → Partial Close scenario ---
  {
    id: 'trade-006',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.PARTIAL_CLOSE_LONG,
    price: '5000.00',
    size: '5.00',
    prevSize: '6.00',
    additionalSize: '-5.00',
    value: 25000,
    fee: '0.10',
    closedPnl: 5293.09,
    closedPnlPercent: 0.0212,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
  {
    id: 'trade-007',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.00',
    prevSize: '0.00',
    additionalSize: '10.00',
    value: 30000,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },

  // --- Add to Long scenario ---
  {
    id: 'trade-008',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.ADD_TO_LONG,
    price: '3000.00',
    size: '5.00',
    prevSize: '10.00',
    additionalSize: '5.00',
    value: 15000,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
  {
    id: 'trade-009',
    marketId: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.00',
    prevSize: '0.00',
    additionalSize: '10.00',
    value: 30000,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
    entryPrice: 3000.01,
    liquidationPrice: 2000.01,
    orderId: '',
    positionId: '',
  },
];

const $OutputSigned = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    })[sign]};
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
