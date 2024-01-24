import { useEffect } from 'react';
import styled, { type AnyStyledComponent, css } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { ColumnSize } from '@react-types/table';
import { Nullable } from '@dydxprotocol/v4-abacus';

import { type Asset, type SubaccountFill } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { MarketTableCell } from '@/components/Table/MarketTableCell';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { Table, TableCell, TableColumnHeader, type ColumnDef } from '@/components/Table';
import { TagSize } from '@/components/Tag';

import {
  getCurrentMarketFills,
  getHasUnseenFillUpdates,
  getSubaccountFills,
} from '@/state/accountSelectors';

import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';
import { viewedFills } from '@/state/account';

import { openDialog } from '@/state/dialogs';

import { MustBigNumber } from '@/lib/numbers';
import { getHydratedTradingData } from '@/lib/orders';

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
  asset: Asset;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
  orderSide: OrderSide;
} & SubaccountFill;

const getFillsTableColumnDef = ({
  key,
  isTablet = false,
  stringGetter,
  symbol = '',
  width,
}: {
  key: FillsTableColumnKey;
  isTablet?: boolean;
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
        label: `${stringGetter({ key: STRING_KEYS.TYPE })} / ${stringGetter({
          key: STRING_KEYS.AMOUNT,
        })}`,
        renderCell: ({ resources, size, stepSizeDecimals, asset: { id } }) => (
          <TableCell stacked slotLeft={<Styled.AssetIcon symbol={id} />}>
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
        label: `${stringGetter({ key: STRING_KEYS.PRICE })} / ${stringGetter({
          key: STRING_KEYS.FEE,
        })}`,
        renderCell: ({ fee, orderSide, price, resources, tickSizeDecimals }) => (
          <TableCell stacked>
            <Styled.InlineRow>
              <Styled.Side side={orderSide}>
                {resources.sideStringKey ? stringGetter({ key: resources.sideStringKey }) : null}
              </Styled.Side>
              <Styled.SecondaryColor>@</Styled.SecondaryColor>
              <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
            </Styled.InlineRow>
            <Styled.InlineRow>
              <Styled.BaseColor>
                {resources.liquidityStringKey
                  ? stringGetter({ key: resources.liquidityStringKey })
                  : null}
              </Styled.BaseColor>
              <Output type={OutputType.Fiat} value={fee} />
            </Styled.InlineRow>
          </TableCell>
        ),
      },
      [FillsTableColumnKey.Time]: {
        columnKey: 'time',
        getCellValue: (row) => row.createdAtMilliseconds,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        renderCell: ({ createdAtMilliseconds }) => (
          <Styled.TimeOutput
            type={OutputType.RelativeTime}
            relativeTimeFormatOptions={{ format: 'singleCharacter' }}
            value={createdAtMilliseconds}
          />
        ),
      },
      [FillsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ asset, marketId }) => <MarketTableCell asset={asset} marketId={marketId} />,
      },
      [FillsTableColumnKey.Action]: {
        columnKey: 'market-simple',
        getCellValue: (row) => row.marketId,
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        renderCell: ({ asset, orderSide }) => (
          <Styled.TableCell>
            <Styled.Side side={orderSide}>
              {stringGetter({
                key: {
                  [OrderSide.BUY]: STRING_KEYS.BUY,
                  [OrderSide.SELL]: STRING_KEYS.SELL,
                }[orderSide],
              })}
            </Styled.Side>
            <Output type={OutputType.Text} value={asset?.id} />
          </Styled.TableCell>
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
        label: isTablet ? (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.TOTAL })}</span>
            <span>{stringGetter({ key: STRING_KEYS.FEE })}</span>
          </TableColumnHeader>
        ) : (
          `${stringGetter({ key: STRING_KEYS.TOTAL })} / ${stringGetter({
            key: STRING_KEYS.FEE,
          })}`
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
        renderCell: ({ orderSide }) => <OrderSideTag orderSide={orderSide} size={TagSize.Medium} />,
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
              }[orderSide],
            })}
          />
        ),
      },
      [FillsTableColumnKey.AmountPrice]: {
        columnKey: 'sizePrice',
        getCellValue: (row) => row.size,
        label: isTablet ? (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.AMOUNT })}</span>
            <span>{stringGetter({ key: STRING_KEYS.PRICE })}</span>
          </TableColumnHeader>
        ) : (
          `${stringGetter({ key: STRING_KEYS.AMOUNT })} / ${stringGetter({
            key: STRING_KEYS.PRICE,
          })}`
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
        label: isTablet ? (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.TYPE })}</span>
            <span>{stringGetter({ key: STRING_KEYS.LIQUIDITY })}</span>
          </TableColumnHeader>
        ) : (
          `${stringGetter({ key: STRING_KEYS.TYPE })} / ${stringGetter({
            key: STRING_KEYS.LIQUIDITY,
          })}`
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
    } as Record<FillsTableColumnKey, ColumnDef<FillTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys: FillsTableColumnKey[];
  columnWidths?: Partial<Record<FillsTableColumnKey, ColumnSize>>;
  currentMarket?: string;
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
  withGradientCardRows,
  withOuterBorder,
  withInnerBorders = true,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { isMobile, isTablet } = useBreakpoints();

  const marketFills = useSelector(getCurrentMarketFills, shallowEqual) || [];
  const allFills = useSelector(getSubaccountFills, shallowEqual) || [];
  const fills = currentMarket ? marketFills : allFills;

  const allPerpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const allAssets = useSelector(getAssets, shallowEqual) || {};

  const hasUnseenFillUpdates = useSelector(getHasUnseenFillUpdates);

  useEffect(() => {
    if (hasUnseenFillUpdates) dispatch(viewedFills());
  }, [hasUnseenFillUpdates]);

  const symbol = currentMarket ? allAssets[allPerpetualMarkets[currentMarket]?.assetId]?.id : null;

  const fillsData = fills.map((fill: SubaccountFill) =>
    getHydratedTradingData({
      data: fill,
      assets: allAssets,
      perpetualMarkets: allPerpetualMarkets,
    })
  ) as FillTableRow[];

  return (
    <Styled.Table
      key={currentMarket ?? 'all-fills'}
      label="Fills"
      data={
        isMobile && withGradientCardRows ? fillsData.slice(0, MOBILE_FILLS_PER_PAGE) : fillsData
      }
      getRowKey={(row: FillTableRow) => row.id}
      onRowAction={(key: string) =>
        dispatch(
          openDialog({
            type: DialogTypes.FillDetails,
            dialogProps: { fillId: key },
          })
        )
      }
      columns={columnKeys.map((key: FillsTableColumnKey, index: number) =>
        getFillsTableColumnDef({
          key,
          isTablet,
          stringGetter,
          symbol,
          width: columnWidths?.[key],
        })
      )}
      slotEmpty={
        <>
          <Styled.Icon iconName={IconName.History} />
          <h4>{stringGetter({ key: STRING_KEYS.TRADES_EMPTY_STATE })}</h4>
        </>
      }
      withOuterBorder={withOuterBorder}
      withInnerBorders={withInnerBorders}
      withScrollSnapColumns
      withScrollSnapRows
      withFocusStickyRows
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
`;

Styled.TableCell = styled(TableCell)`
  gap: 0.25rem;
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.Icon = styled(Icon)`
  font-size: 3em;
`;

Styled.AssetIcon = styled(AssetIcon)`
  font-size: 2.25rem;
`;

Styled.SecondaryColor = styled.span`
  color: var(--color-text-0);
`;

Styled.BaseColor = styled.span`
  color: var(--color-text-1);
`;

Styled.TimeOutput = styled(Output)`
  color: var(--color-text-0);
`;

Styled.Side = styled.span<{ side: OrderSide }>`
  ${({ side }) =>
    ({
      [OrderSide.BUY]: css`
        color: var(--color-positive);
      `,
      [OrderSide.SELL]: css`
        color: var(--color-negative);
      `,
    }[side])};
`;
