import { Key, useCallback, useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { css, keyframes } from 'styled-components';

import { type OrderbookLine } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { ORDERBOOK_MAX_ROWS_PER_SIDE } from '@/constants/orderbook';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { CustomRowConfig, ColumnDef, TableRow } from '@/components/Table';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getSubaccountOrderSizeBySideAndPrice } from '@/state/accountSelectors';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { setTradeFormInputs } from '@/state/inputs';
import { getCurrentInput } from '@/state/inputsSelectors';
import { getCurrentMarketConfig, getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';

import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
import { MustBigNumber } from '@/lib/numbers';

import { OrderbookTradesOutput, OrderbookTradesTable } from './OrderbookTradesTable';

type ElementProps = {
  maxRowsPerSide?: number;
  layout?: 'vertical' | 'horizontal';
};

type StyleProps = {
  hideHeader?: boolean;
  histogramSide?: 'left' | 'right';
  className?: string;
};

type RowData = Pick<OrderbookLine, 'depth' | 'offset' | 'price' | 'size'> & {
  side: 'bid' | 'ask';
  mine?: number;
  key: string;
};

const useCalculateOrderbookData = ({ maxRowsPerSide }: { maxRowsPerSide: number }) => {
  const orderbook = useSelector(getCurrentMarketOrderbook, shallowEqual);

  const subaccountOrderSizeBySideAndPrice =
    useSelector(getSubaccountOrderSizeBySideAndPrice, shallowEqual) || {};

  return useMemo(() => {
    const asks = (orderbook?.asks?.toArray() ?? [])
      .map(
        (row: OrderbookLine, idx: number) =>
          ({
            key: `ask-${idx}`,
            side: 'ask',
            mine: subaccountOrderSizeBySideAndPrice[OrderSide.SELL]?.[row.price],
          } as RowData)
      )
      .slice(0, maxRowsPerSide);

    const bids = (orderbook?.bids?.toArray() ?? [])
      .map(
        (row: OrderbookLine, idx: number) =>
          ({
            key: `bid-${idx}`,
            side: 'bid',
            mine: subaccountOrderSizeBySideAndPrice[OrderSide.BUY]?.[row.price],
            ...row,
          } as RowData)
      )
      .slice(0, maxRowsPerSide);

    // Prevent the bid/ask sides from crossing by using the offsets.
    // While the books are crossing...
    while (asks[0] && bids[0] && bids[0]!.price >= asks[0].price) {
      // Drop the order on the side with the lower offset.
      // The offset of the other side is higher and so supercedes.
      if (bids[0]!.offset === asks[0].offset) {
        // If offsets are the same, give precedence to the larger size. In this case,
        // one of the sizes *should* be zero, but we simply check for the larger size.
        if (bids[0]!.size > asks[0].size) {
          asks.shift();
        } else {
          bids.pop();
        }
      } else {
        // Offsets are not equal. Give precedence to the larger offset.
        if (bids[0]!.offset > asks[0].offset) {
          asks.shift();
        } else {
          bids.pop();
        }
      }
    }

    const spread =
      asks[0]?.price && bids[0]?.price ? MustBigNumber(asks[0].price).minus(bids[0].price) : null;

    const spreadPercent = orderbook?.spreadPercent;

    const histogramRange = Math.max(
      Number.isNaN(Number(bids[bids.length - 1]?.depth)) ? 0 : Number(bids[bids.length - 1]?.depth),
      Number.isNaN(Number(asks[asks.length - 1]?.depth)) ? 0 : Number(asks[asks.length - 1]?.depth)
    );

    // Ensure asks and bids are of length maxRowsPerSide by adding empty rows.
    let idx = asks.length - 1;
    while (asks.length < maxRowsPerSide) {
      idx += 1;

      asks.push({
        key: `ask-${idx}`,
        side: 'ask',
        size: 0,
        price: 0,
        offset: 0,
        depth: 0,
      });
    }

    idx = bids.length - 1;
    while (bids.length < maxRowsPerSide) {
      idx += 1;

      bids.push({
        key: `bid-${idx}`,
        side: 'bid',
        size: 0,
        price: 0,
        offset: 0,
        depth: 0,
      });
    }

    return { asks, bids, spread, spreadPercent, histogramRange, hasOrderbook: !!orderbook };
  }, [orderbook, subaccountOrderSizeBySideAndPrice]);
};

const OrderbookTable = ({
  data,
  histogramSide,
  showMineColumn,
  symbol,
  stepSizeDecimals,
  tickSizeDecimals,
  histogramRange,
  onRowAction,
  className,
  hideHeader,
}: {
  data: (RowData | CustomRowConfig)[];
  histogramSide?: 'left' | 'right';
  showMineColumn: boolean;
  symbol: string | null;
  stepSizeDecimals: number | undefined | null;
  tickSizeDecimals: number | undefined | null;
  histogramRange: number;
  onRowAction: (key: Key, row: RowData) => void;
  className?: string;
  hideHeader?: boolean;
}) => {
  const stringGetter = useStringGetter();

  const columns = useMemo((): ColumnDef<RowData>[] => {
    return [
      {
        columnKey: 'size',
        getCellValue: (row: RowData) => row.size,
        label: stringGetter({ key: STRING_KEYS.ORDERBOOK_ORDER_SIZE }),
        tag: symbol,
        renderCell: (row: RowData) =>
          row.size > 0 && (
            <$HistogramOutput
              highlightText
              type={OutputType.Asset}
              value={row.size}
              fractionDigits={stepSizeDecimals}
              histogramSide={histogramSide === 'left' ? 'left' : undefined}
              useGrouping={false}
            />
          ),
      },
      {
        columnKey: 'price',
        getCellValue: (row: RowData) => row.price,
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        tag: 'USD',
        renderCell: (row: RowData) =>
          row.price > 0 && (
            <OrderbookTradesOutput
              highlightText
              type={OutputType.Number}
              value={row.price}
              fractionDigits={tickSizeDecimals}
              useGrouping={false}
            />
          ),
      },
      {
        columnKey: 'subaccount-orders',
        getCellValue: (row: RowData) => row.mine ?? '',
        label: showMineColumn && stringGetter({ key: STRING_KEYS.ORDERBOOK_MY_ORDER_SIZE }),
        renderCell: (row: RowData) => (
          <span>
            <$HistogramOutput
              highlightText
              type={row.mine ? OutputType.Asset : OutputType.Text}
              value={row.mine}
              fractionDigits={stepSizeDecimals}
              histogramSide={histogramSide === 'right' ? 'right' : undefined}
              useGrouping={false}
            />
          </span>
        ),
      },
    ].filter(Boolean);
  }, [showMineColumn, symbol, stepSizeDecimals, tickSizeDecimals, histogramSide, stringGetter]);

  return (
    <$OrderbookTable
      key={`orderbook-${histogramSide}`}
      label="Orderbook"
      data={data}
      columns={columns}
      getRowKey={(row: RowData) => row.key}
      getRowAttributes={(row: RowData) => ({
        'data-side': row.side,
        style: {
          '--histogram-bucket-size': row.size,
          '--histogram-bucket-depth': row.depth,
          '--tr-pointerEvents': row.price ? 'auto' : 'none',
        },
      })}
      onRowAction={onRowAction}
      // shouldRowRender={shouldRowRender}
      className={className}
      // Style props
      histogramSide={histogramSide}
      hideHeader={hideHeader}
      style={{
        '--histogram-range': histogramRange,
      }}
    />
  );
};

export const Orderbook = ({
  className,
  layout = 'vertical',
  histogramSide = 'left',
  maxRowsPerSide = ORDERBOOK_MAX_ROWS_PER_SIDE,
  hideHeader = false,
}: ElementProps & StyleProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const currentInput = useSelector(getCurrentInput);
  const { id = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { stepSizeDecimals, tickSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const showMineColumn = useSelector(calculateCanViewAccount) && !isTablet;

  const { asks, bids, spread, spreadPercent, histogramRange, hasOrderbook } =
    useCalculateOrderbookData({
      maxRowsPerSide,
    });

  const data = useMemo(
    () =>
      [
        ...bids.reverse(),
        {
          key: 'spread',
          // TODO - should probably refactor this to not break the lint rule
          // eslint-disable-next-line react/no-unstable-nested-components
          slotCustomRow: (props) => (
            <$SpreadTableRow key="spread" {...props}>
              <td>
                <WithTooltip tooltip="spread">
                  {stringGetter({ key: STRING_KEYS.ORDERBOOK_SPREAD })}
                </WithTooltip>
              </td>
              <td>
                <Output type={OutputType.Number} value={spread} fractionDigits={tickSizeDecimals} />
              </td>
              <td>{!isTablet && <Output type={OutputType.Percent} value={spreadPercent} />}</td>
            </$SpreadTableRow>
          ),
        } as CustomRowConfig,
        ...asks,
      ].reverse(),
    [asks, bids, spread, spreadPercent, isTablet]
  );

  const onRowAction = useCallback(
    (key: Key, row: RowData) => {
      if (currentInput === 'trade' && key !== 'spread' && row?.price) {
        dispatch(setTradeFormInputs({ limitPriceInput: row?.price?.toString() }));
      }
    },
    [currentInput]
  );

  const orderbookTableProps = {
    showMineColumn,
    symbol: id,
    stepSizeDecimals,
    tickSizeDecimals,
    histogramRange,
    onRowAction,
    className,
    hideHeader,
  } as const;

  if (!hasOrderbook) {
    return <LoadingSpace id="orderbook-loading" />;
  }

  return layout === 'vertical' ? (
    <OrderbookTable data={data} histogramSide={histogramSide} {...orderbookTableProps} />
  ) : (
    <$HorizontalLayout className={className}>
      <$Header>
        <$SpreadDetails
          items={[
            {
              key: 'spread',
              label: stringGetter({ key: STRING_KEYS.ORDERBOOK_SPREAD }),
              tooltip: 'spread',
              value: (
                <>
                  <Output
                    type={OutputType.Number}
                    value={spread}
                    fractionDigits={tickSizeDecimals}
                  />
                  {!isTablet && <Output type={OutputType.Percent} value={spreadPercent} />}
                </>
              ),
            },
          ]}
          layout="row"
        />
        {/* TODO: TRCL-1411 implement zoom here */}
      </$Header>
      <$SplitOrderbook>
        <OrderbookTable data={asks} histogramSide="right" {...orderbookTableProps} />
        <OrderbookTable data={bids.reverse()} histogramSide="left" {...orderbookTableProps} />
      </$SplitOrderbook>
    </$HorizontalLayout>
  );
};

export type OrderbookScrollBehavior = 'free' | 'snapToCenter' | 'snapToCenterUnlessHovered';

export const orderbookMixins = {
  scrollArea: css<{ isShowingOrderbook?: boolean; scrollBehavior: OrderbookScrollBehavior }>`
    contain: strict;
    isolation: isolate;

    overflow-anchor: none;
    scroll-behavior: auto;
    overflow-x: clip;

    ${({ isShowingOrderbook = true, scrollBehavior = 'snapToCenterUnlessHovered' }) =>
      isShowingOrderbook &&
      {
        free: () => css`
          scroll-snap-type: none;
        `,

        snapToCenter: () => css`
          scroll-snap-type: y mandatory;

          * {
            scroll-snap-align: none !important;
          }
        `,

        // Snap orderbook scroll position to Spread row or focused row except while hovered (0.25s debounce)
        snapToCenterUnlessHovered: () => css`
          scroll-snap-type: none;

          &:not(:hover) {
            scroll-behavior: auto;

            animation: ${keyframes`
              to {
                scroll-snap-type: y mandatory;
              }
            `} 0s 0.25s forwards;
          }
        `,

        // Simpler implementation without debounce
        // snapToCenterUnlessHovered: () => css`
        //   scroll-snap-type: y mandatory;
        //   &:not(:hover):not(:focus-within) {
        //     scroll-behavior: auto;
        //   }
        //   &:hover *,
        //   &:focus-within * {
        //     scroll-snap-align: none !important;
        //   }
        // `,
      }[scrollBehavior]}
  `,

  scrollSnapItem: css`
    ${layoutMixins.scrollSnapItem}
    scroll-snap-align: center !important;
    scroll-snap-stop: always;
  `,
} as const;
const fadeAnimation = keyframes`
20% {
  opacity: 0.6;
}
`;

const $HorizontalLayout = styled.div`
  ${layoutMixins.expandingColumnWithHeader}
  ${layoutMixins.withInnerHorizontalBorders}

  /* TODO: make <Table> accept dynamic stickyArea level (stickyArea2) */
  --stickyArea0-topGap: -1px;
  ${layoutMixins.stickyArea1}
  --stickyArea1-background: var(--color-layer-2);
  --stickyArea1-topHeight: 1.75rem;
  --stickyArea1-topGap: var(--border-width);

  @media ${breakpoints.tablet} {
    --stickyArea1-topHeight: 2.5rem;
  }
`;

const $HistogramOutput = styled(OrderbookTradesOutput)<StyleProps>`
  ${({ histogramSide }) =>
    histogramSide
      ? css`
          /* Size/cumulative size Histogram */
          &:before,
          &:after {
            content: '';

            position: absolute;

            inset: 1px -2px;
            ${histogramSide === 'left'
              ? css`
                  right: auto;
                `
              : css`
                  left: auto;
                `}

            border-radius: 2px;
          }

          /* Histogram: Size bar */
          &:before {
            width: calc(
              var(--histogram-bucket-size) / var(--histogram-range) * var(--histogram-width)
            );

            background: linear-gradient(
              to var(--histogram-gradient-to),
              var(--accent-color),
              transparent 500%
            );
            opacity: 0.4;

            tr:hover & {
              opacity: 0.75;
            }

            @media (prefers-reduced-motion: no-preference) {
              animation: ${fadeAnimation} 0.5s;
            }
          }

          /* Histogram: Depth bar */
          &:after {
            width: calc(
              var(--histogram-bucket-depth) / var(--histogram-range) * var(--histogram-width)
            );

            background: linear-gradient(
              to var(--histogram-gradient-to),
              var(--accent-color),
              transparent 130%
            );
            opacity: 0.15;

            tr:hover & {
              opacity: 0.5;
            }
          }
        `
      : ''}
`;

const orderbookTableType = getSimpleStyledOutputType(OrderbookTradesTable, {} as StyleProps);
const $OrderbookTable = styled(OrderbookTradesTable)<StyleProps>`
  /* Params */
  --orderbook-spreadRowHeight: 2rem;

  /* Rules */

  table {
    min-height: 100%;
  }

  tr {
    --histogram-bucket-depth: 0;
    pointer-events: var(--tr-pointerEvents);

    &[data-side='bid'] {
      --accent-color: var(--color-positive);
    }
    &[data-side='ask'] {
      --accent-color: var(--color-negative);
    }

    /* Last column is conditionally rendered - ensure rows always span the full width */
    &:after {
      content: '';
    }

    ${({ withFocusStickyRows }) =>
      withFocusStickyRows &&
      css`
        &:not(:active):is(:focus-visible, :focus-within) {
          ${orderbookMixins.scrollSnapItem}
          z-index: 2;

          &[data-side='bid'] {
            top: calc(var(--stickyArea-totalInsetTop) + var(--orderbook-spreadRowHeight));
          }
          &[data-side='ask'] {
            bottom: calc(var(--stickyArea-totalInsetBottom) + var(--orderbook-spreadRowHeight));
          }
        }
      `}
  }

  ${$HorizontalLayout} & {
    --tableCell-padding: 0.25rem 1rem;
  }
` as typeof orderbookTableType;

const $SpreadTableRow = styled(TableRow)`
  ${layoutMixins.sticky}
  position: sticky !important;

  height: var(--orderbook-spreadRowHeight);

  // All browsers except Safari (box-shadow doesn't apply to display: table-row 😕)
  @supports not (background: -webkit-named-image(i)) {
    ${layoutMixins.withOuterBorder}
  }

  &:only-of-type {
    top: 50%;
    bottom: 50%;
  }

  // have to override since we destroyed the string typings with the inline cast above
  ${$OrderbookTable as any}:not(:focus-within) & {
    ${orderbookMixins.scrollSnapItem}
  }

  td > * {
    vertical-align: middle;
  }

  td {
    padding: var(--tableCell-padding);

    // Safari: apply box-shadow to inner table-cells
    @supports (background: -webkit-named-image(i)) {
      box-shadow: 0 calc(-1 * var(--border-width)) var(--color-border) inset,
        0 var(--border-width) var(--color-border) inset;
    }
  }
`;

const $SpreadDetails = styled(Details)<{ asTableCells?: boolean }>`
  /* Overrides */
  --details-item-backgroundColor: var(--color-layer-2);
  --details-value-font: var(--font-mini-book);
  font: var(--font-mini-book);

  @media ${breakpoints.tablet} {
    font: var(--font-base-book);
    --details-value-font: var(--font-base-book);
  }
`;

const $SplitOrderbook = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--border-width);
`;

const $Header = styled.header`
  ${layoutMixins.stickyHeader}
  ${layoutMixins.spacedRow}
`;
