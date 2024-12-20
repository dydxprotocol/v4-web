import { forwardRef, Key, useMemo } from 'react';

import { AssetInfo } from '@/abacus-ts/rawTypes';
import { getCurrentMarketAccountFills, selectAccountFills } from '@/abacus-ts/selectors/account';
import { selectRawAssetsData, selectRawMarketsData } from '@/abacus-ts/selectors/base';
import { IndexerFillType, IndexerLiquidity, IndexerOrderSide } from '@/types/indexer/indexerApiGen';
import { IndexerCompositeFillObject } from '@/types/indexer/indexerManual';
import { Nullable } from '@dydxprotocol/v4-abacus';
import type { ColumnSize } from '@react-types/table';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { Asset } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useViewPanel } from '@/hooks/useSeen';
import { useStringGetter } from '@/hooks/useStringGetter';

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

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { assertNever } from '@/lib/assertNever';
import { getAssetFromMarketId } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { MustBigNumber } from '@/lib/numbers';
import { getHydratedFill } from '@/lib/orders';
import { orEmptyRecord } from '@/lib/typeUtils';

const MOBILE_FILLS_PER_PAGE = 50;

export enum FillsTableColumnKey {
  Time = 'Time',
  Market = 'Market',
  Action = 'Action',
  Side = 'Side',
  Type = 'Type',
  Price = 'Price',
  Liquidity = 'Liquidity',
  AmountPrice = 'Amount-Price',
  AmountTag = 'Amount-Tag',
  Total = 'Total',
  Fee = 'Fee',

  // Tablet Only
  TypeAmount = 'Type-Amount',
  PriceFee = 'Price-Fee',
}

export type FillTableRow = {
  asset: Nullable<AssetInfo>;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
} & IndexerCompositeFillObject;

const getFillsTableColumnDef = ({
  key,
  stringGetter,
  symbol = '',
  width,
}: {
  key: FillsTableColumnKey;
  stringGetter: StringGetterFunction;
  symbol?: Nullable<string>;
  width?: ColumnSize;
}): ColumnDef<FillTableRow> => ({
  width,
  ...(
    {
      [FillsTableColumnKey.TypeAmount]: {
        columnKey: 'typeAmount',
        getCellValue: (row) => row.size,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.TYPE })}</span>
            <span>{stringGetter({ key: STRING_KEYS.AMOUNT })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ size, type, stepSizeDecimals, asset }) => (
          <TableCell
            stacked
            slotLeft={<AssetIcon logoUrl={asset?.logo} symbol={asset?.id} tw="text-[2.25rem]" />}
          >
            <span>
              {type != null ? stringGetter({ key: getIndexerFillTypeStringKey(type) }) : null}
            </span>
            <Output
              type={OutputType.Asset}
              value={size}
              fractionDigits={stepSizeDecimals}
              tag={symbol}
            />
          </TableCell>
        ),
      },
      [FillsTableColumnKey.PriceFee]: {
        columnKey: 'priceFee',
        getCellValue: (row) => row.price,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.PRICE })}</span>
            <span>{stringGetter({ key: STRING_KEYS.FEE })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ fee, side, price, tickSizeDecimals, liquidity }) => (
          <TableCell stacked>
            <$InlineRow>
              <$Side side={side}>
                {side != null ? stringGetter({ key: getIndexerOrderSideStringKey(side) }) : null}
              </$Side>
              <span tw="text-color-text-0">@</span>
              <Output
                withSubscript
                type={OutputType.Fiat}
                value={price}
                fractionDigits={tickSizeDecimals}
              />
            </$InlineRow>
            <$InlineRow>
              <span tw="text-color-text-1">
                {liquidity != null
                  ? stringGetter({ key: getIndexerLiquidityStringKey(liquidity) })
                  : null}
              </span>
              <Output type={OutputType.Fiat} value={fee} />
            </$InlineRow>
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Time]: {
        columnKey: 'time',
        getCellValue: (row) => row.createdAt,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        renderCell: ({ createdAt }) => (
          <Output
            type={OutputType.RelativeTime}
            relativeTimeOptions={{ format: 'singleCharacter' }}
            value={createdAt != null ? new Date(createdAt).valueOf() : undefined}
            tw="text-color-text-0"
          />
        ),
      },
      [FillsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.market,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ asset }) => (
          <MarketTableCell
            asset={
              // todo fix this
              asset != null
                ? ({
                    id: asset.id,
                    name: asset.name,
                    tags: [],
                    resources: { imageUrl: asset.logo },
                  } as unknown as Asset)
                : undefined
            }
          />
        ),
      },
      [FillsTableColumnKey.Action]: {
        columnKey: 'market-simple',
        getCellValue: (row) => row.market,
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        renderCell: ({ asset, side }) => (
          <TableCell tw="gap-0.25">
            {side != null && (
              <$Side side={side}>
                {stringGetter({
                  key: getIndexerOrderSideStringKey(side),
                })}
              </$Side>
            )}
            <Output type={OutputType.Text} value={asset?.id} />
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Liquidity]: {
        columnKey: 'liquidity',
        getCellValue: (row) => row.liquidity,
        label: stringGetter({ key: STRING_KEYS.LIQUIDITY }),
        renderCell: ({ liquidity }) =>
          liquidity != null ? stringGetter({ key: getIndexerLiquidityStringKey(liquidity) }) : null,
      },
      [FillsTableColumnKey.Total]: {
        columnKey: 'total',
        getCellValue: (row) =>
          MustBigNumber(row.price)
            .times(row.size ?? 0)
            .toNumber(),
        label: stringGetter({ key: STRING_KEYS.TOTAL }),
        renderCell: ({ size, price }) => (
          <TableCell>
            <Output type={OutputType.Fiat} value={MustBigNumber(price).times(size ?? 0)} />
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Fee]: {
        columnKey: 'fee',
        getCellValue: (row) => row.fee,
        label: stringGetter({ key: STRING_KEYS.FEE }),
        renderCell: ({ fee }) => (
          <TableCell>
            <Output type={OutputType.Fiat} value={fee} />
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Type]: {
        columnKey: 'type',
        getCellValue: (row) => row.type,
        label: stringGetter({ key: STRING_KEYS.TYPE }),
        renderCell: ({ type }) =>
          type != null ? stringGetter({ key: getIndexerFillTypeStringKey(type) }) : null,
      },
      [FillsTableColumnKey.Price]: {
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
      [FillsTableColumnKey.AmountTag]: {
        columnKey: 'amountTag',
        getCellValue: (row) => row.size,
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        tag: symbol,
        renderCell: ({ size, stepSizeDecimals }) => (
          <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />
        ),
      },
      [FillsTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.side,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ side }) => side && <OrderSideTag orderSide={side} size={TagSize.Medium} />,
      },

      [FillsTableColumnKey.AmountPrice]: {
        columnKey: 'sizePrice',
        getCellValue: (row) => row.size,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.AMOUNT })}</span>
            <span>{stringGetter({ key: STRING_KEYS.PRICE })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ size, stepSizeDecimals, price, tickSizeDecimals }) => (
          <TableCell stacked>
            <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={price}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
    } satisfies Record<FillsTableColumnKey, ColumnDef<FillTableRow>>
  )[key],
});

function getIndexerFillTypeStringKey(fillType: IndexerFillType): string {
  switch (fillType) {
    case IndexerFillType.LIMIT:
      return STRING_KEYS.LIMIT_ORDER_SHORT;
    case IndexerFillType.LIQUIDATED:
      return STRING_KEYS.LIQUIDATED;
    case IndexerFillType.LIQUIDATION:
      return STRING_KEYS.LIQUIDATION;
    case IndexerFillType.DELEVERAGED:
      return STRING_KEYS.DELEVERAGED;
    case IndexerFillType.OFFSETTING:
      return STRING_KEYS.OFFSETTING;
    default:
      assertNever(fillType);
      return STRING_KEYS.LIMIT_ORDER_SHORT;
  }
}

function getIndexerLiquidityStringKey(liquidity: IndexerLiquidity): string {
  switch (liquidity) {
    case IndexerLiquidity.MAKER:
      return STRING_KEYS.MAKER;
    case IndexerLiquidity.TAKER:
      return STRING_KEYS.TAKER;
    default:
      assertNever(liquidity);
      return STRING_KEYS.MAKER;
  }
}

function getIndexerOrderSideStringKey(side: IndexerOrderSide) {
  if (side === IndexerOrderSide.BUY) {
    return STRING_KEYS.BUY;
  }
  return STRING_KEYS.SELL;
}

type ElementProps = {
  columnKeys: FillsTableColumnKey[];
  columnWidths?: Partial<Record<FillsTableColumnKey, ColumnSize>>;
  currentMarket?: string;
  initialPageSize?: PageSize;
};

type StyleProps = {
  withGradientCardRows?: boolean;
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
};

export const FillsTable = forwardRef(
  (
    {
      columnKeys,
      columnWidths,
      currentMarket,
      initialPageSize,
      withGradientCardRows,
      withOuterBorder,
      withInnerBorders = true,
    }: ElementProps & StyleProps,
    _ref
  ) => {
    const stringGetter = useStringGetter();
    const dispatch = useAppDispatch();
    const { isMobile } = useBreakpoints();

    const marketFills = useAppSelector(getCurrentMarketAccountFills);
    const allFills = useAppSelector(selectAccountFills);
    const fills = currentMarket ? marketFills : allFills;

    const allPerpetualMarkets = orEmptyRecord(useAppSelector(selectRawMarketsData));
    const allAssets = orEmptyRecord(useAppSelector(selectRawAssetsData));

    useViewPanel(currentMarket, 'fills');

    const symbol = mapIfPresent(currentMarket, (market) =>
      mapIfPresent(
        allPerpetualMarkets[market]?.ticker,
        (ticker) => allAssets[getAssetFromMarketId(ticker)]?.id
      )
    );

    const fillsData = useMemo(
      () =>
        fills.map(
          (fill: IndexerCompositeFillObject): FillTableRow =>
            getHydratedFill({
              data: fill,
              assets: allAssets,
              perpetualMarkets: allPerpetualMarkets,
            })
        ),
      [fills, allPerpetualMarkets, allAssets]
    );

    return (
      <$Table
        key={currentMarket ?? 'all-fills'}
        label="Fills"
        data={
          isMobile && withGradientCardRows ? fillsData.slice(0, MOBILE_FILLS_PER_PAGE) : fillsData
        }
        getRowKey={(row: FillTableRow) => row.id ?? ''}
        onRowAction={(key: Key) =>
          dispatch(openDialog(DialogTypes.FillDetails({ fillId: `${key}` })))
        }
        columns={columnKeys.map((key: FillsTableColumnKey) =>
          getFillsTableColumnDef({
            key,
            stringGetter,
            symbol,
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
  ${tradeViewMixins.horizontalTable}
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
