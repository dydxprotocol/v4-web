import { Key, useEffect, useMemo } from 'react';

import { Nullable } from '@dydxprotocol/v4-abacus';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { ColumnSize } from '@react-types/table';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { type Asset, type SubaccountFill } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useBreakpoints } from '@/hooks/useBreakpoints';
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

import { viewedFills } from '@/state/account';
import { getCurrentMarketFills, getSubaccountFills } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { openDialog } from '@/state/dialogs';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { getHydratedTradingData } from '@/lib/orders';
import { orEmptyRecord } from '@/lib/typeUtils';

const MOBILE_FILLS_PER_PAGE = 50;

export enum FillsTableColumnKey {
  Time = 'Time',
  Market = 'Market',
  Action = 'Action',
  Side = 'Side',
  SideLongShort = 'Side-LongShort',
  Type = 'Type',
  Price = 'Price',
  Liquidity = 'Liquidity',
  AmountPrice = 'Amount-Price',
  AmountTag = 'Amount-Tag',
  TotalFee = 'Total-Fee',
  TypeLiquidity = 'Type-Liquidity',

  // Tablet Only
  TypeAmount = 'Type-Amount',
  PriceFee = 'Price-Fee',
}

export type FillTableRow = {
  asset: Nullable<Asset>;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
  orderSide?: Nullable<OrderSide>;
} & SubaccountFill;

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
        renderCell: ({ resources, size, stepSizeDecimals, asset }) => (
          <TableCell stacked slotLeft={<AssetIcon symbol={asset?.id} tw="text-[2.25rem]" />}>
            <span>
              {resources.typeStringKey ? stringGetter({ key: resources.typeStringKey }) : null}
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
        renderCell: ({ fee, orderSide, price, resources, tickSizeDecimals }) => (
          <TableCell stacked>
            <$InlineRow>
              <$Side side={orderSide}>
                {resources.sideStringKey ? stringGetter({ key: resources.sideStringKey }) : null}
              </$Side>
              <span tw="text-color-text-0">@</span>
              <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
            </$InlineRow>
            <$InlineRow>
              <span tw="text-color-text-1">
                {resources.liquidityStringKey
                  ? stringGetter({ key: resources.liquidityStringKey })
                  : null}
              </span>
              <Output type={OutputType.Fiat} value={fee} />
            </$InlineRow>
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Time]: {
        columnKey: 'time',
        getCellValue: (row) => row.createdAtMilliseconds,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        renderCell: ({ createdAtMilliseconds }) => (
          <Output
            type={OutputType.RelativeTime}
            relativeTimeOptions={{ format: 'singleCharacter' }}
            value={createdAtMilliseconds}
            tw="text-color-text-0"
          />
        ),
      },
      [FillsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ asset, marketId }) => (
          <MarketTableCell asset={asset ?? undefined} marketId={marketId} />
        ),
      },
      [FillsTableColumnKey.Action]: {
        columnKey: 'market-simple',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        renderCell: ({ asset, orderSide }) => (
          <TableCell tw="gap-0.25">
            {orderSide && (
              <$Side side={orderSide}>
                {stringGetter({
                  key: {
                    [OrderSide.BUY]: STRING_KEYS.BUY,
                    [OrderSide.SELL]: STRING_KEYS.SELL,
                  }[orderSide],
                })}
              </$Side>
            )}
            <Output type={OutputType.Text} value={asset?.id} />
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Liquidity]: {
        columnKey: 'liquidity',
        getCellValue: (row) => row.liquidity.rawValue,
        label: stringGetter({ key: STRING_KEYS.LIQUIDITY }),
        renderCell: ({ resources }) =>
          resources.liquidityStringKey ? stringGetter({ key: resources.liquidityStringKey }) : null,
      },
      [FillsTableColumnKey.TotalFee]: {
        columnKey: 'totalFee',
        getCellValue: (row) => MustBigNumber(row.price).times(row.size).toNumber(),
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.TOTAL })}</span>
            <span>{stringGetter({ key: STRING_KEYS.FEE })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ size, fee, price }) => (
          <TableCell stacked>
            <Output type={OutputType.Fiat} value={MustBigNumber(price).times(size)} />
            <Output type={OutputType.Fiat} value={fee} />
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Type]: {
        columnKey: 'type',
        getCellValue: (row) => row.type.rawValue,
        label: stringGetter({ key: STRING_KEYS.TYPE }),
        renderCell: ({ resources }) =>
          resources.typeStringKey ? stringGetter({ key: resources.typeStringKey }) : null,
      },
      [FillsTableColumnKey.Price]: {
        columnKey: 'price',
        getCellValue: (row) => row.price,
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        renderCell: ({ price, tickSizeDecimals }) => (
          <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
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
        getCellValue: (row) => row.orderSide,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ orderSide }) =>
          orderSide && <OrderSideTag orderSide={orderSide} size={TagSize.Medium} />,
      },
      [FillsTableColumnKey.SideLongShort]: {
        columnKey: 'side',
        getCellValue: (row) => row.orderSide,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ orderSide }) => (
          <Output
            type={OutputType.Text}
            value={stringGetter({
              key: {
                [OrderSide.BUY]: STRING_KEYS.LONG_POSITION_SHORT,
                [OrderSide.SELL]: STRING_KEYS.SHORT_POSITION_SHORT,
              }[orderSide ?? OrderSide.BUY],
            })}
          />
        ),
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
            <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
          </TableCell>
        ),
      },
      [FillsTableColumnKey.TypeLiquidity]: {
        columnKey: 'typeLiquidity',
        getCellValue: (row) => row.type.rawValue,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.TYPE })}</span>
            <span>{stringGetter({ key: STRING_KEYS.LIQUIDITY })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ resources }) => (
          <TableCell stacked>
            <span>
              {resources.typeStringKey ? stringGetter({ key: resources.typeStringKey }) : null}
            </span>
            <span>
              {resources.liquidityStringKey
                ? stringGetter({ key: resources.liquidityStringKey })
                : null}
            </span>
          </TableCell>
        ),
      },
    } satisfies Record<FillsTableColumnKey, ColumnDef<FillTableRow>>
  )[key],
});

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

export const FillsTable = ({
  columnKeys,
  columnWidths,
  currentMarket,
  initialPageSize,
  withGradientCardRows,
  withOuterBorder,
  withInnerBorders = true,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { isMobile } = useBreakpoints();

  const marketFills = useAppSelector(getCurrentMarketFills, shallowEqual) ?? EMPTY_ARR;
  const allFills = useAppSelector(getSubaccountFills, shallowEqual) ?? EMPTY_ARR;
  const fills = currentMarket ? marketFills : allFills;

  const allPerpetualMarkets = orEmptyRecord(useAppSelector(getPerpetualMarkets, shallowEqual));
  const allAssets = orEmptyRecord(useAppSelector(getAssets, shallowEqual));

  useEffect(() => {
    // marked fills as seen both on mount and dismount (i.e. new fill came in while fills table is being shown)
    dispatch(viewedFills(currentMarket));
    return () => {
      dispatch(viewedFills(currentMarket));
    };
  }, [currentMarket]);

  const symbol = currentMarket ? allAssets[allPerpetualMarkets[currentMarket]?.assetId]?.id : null;

  const fillsData = useMemo(
    () =>
      fills.map(
        (fill: SubaccountFill): FillTableRow =>
          getHydratedTradingData({
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
      getRowKey={(row: FillTableRow) => row.id}
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
};
const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
` as typeof Table;
const $InlineRow = tw.div`inlineRow`;
const $Side = styled.span<{ side: Nullable<OrderSide> }>`
  ${({ side }) =>
    side &&
    {
      [OrderSide.BUY]: css`
        color: var(--color-positive);
      `,
      [OrderSide.SELL]: css`
        color: var(--color-negative);
      `,
    }[side]};
`;
