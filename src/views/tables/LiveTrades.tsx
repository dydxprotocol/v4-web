import { useMemo } from 'react';
import styled, { type AnyStyledComponent, css, keyframes } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { MarketTrade } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketConfig, getCurrentMarketLiveTrades } from '@/state/perpetualsSelectors';

import { OrderbookTradesOutput, OrderbookTradesTable } from './OrderbookTradesTable';
import { getSelectedOrderSide } from '@/lib/tradeData';
import { isTruthy } from '@/lib/isTruthy';

const MAX_ORDERBOOK_BAR_SIZE = 0.4;
const LARGE_TRADE_USD_VALUE = 10000;

type StyleProps = {
  className?: string;
  histogramSide: 'left' | 'right';
};

// Current fix for styled-component not preserving generic row
type RowData = {
  key: number;
  createdAtMilliseconds: number;
  price: number;
  side: OrderSide;
  size: number;
};

export const LiveTrades = ({ className, histogramSide = 'left' }: StyleProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const currentMarketAssetData = useSelector(getCurrentMarketAssetData, shallowEqual);
  const currentMarketConfig = useSelector(getCurrentMarketConfig, shallowEqual);
  const currentMarketLiveTrades = useSelector(getCurrentMarketLiveTrades, shallowEqual) || [];

  const { symbol = '' } = currentMarketAssetData ?? {};
  const { stepSizeDecimals, tickSizeDecimals } = currentMarketConfig || {};

  const rows = currentMarketLiveTrades.map(
    ({ createdAtMilliseconds, price, size, side }: MarketTrade, idx) => ({
      key: idx,
      createdAtMilliseconds,
      price,
      side: getSelectedOrderSide(side),
      size,
    })
  );

  const columns = useMemo(() => {
    const timeColumn = {
      columnKey: 'time',
      getCellValue: (row: RowData) => row.createdAtMilliseconds,
      label: stringGetter({ key: STRING_KEYS.TIME }),
      renderCell: (row: RowData) => (
        <Styled.TimeOutput type={OutputType.Time} value={row.createdAtMilliseconds} />
      ),
    };
    return [
      isTablet && timeColumn,
      isTablet && {
        columnKey: 'side',
        getCellValue: (row: RowData) => row.size,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: (row: RowData) => (
          <Styled.SideOutput
            type={OutputType.Text}
            value={stringGetter({
              key: row.side === OrderSide.BUY ? STRING_KEYS.BUY : STRING_KEYS.SELL,
            })}
          />
        ),
      },
      {
        columnKey: 'size',
        getCellValue: (row: RowData) => row.size,
        label: stringGetter({ key: STRING_KEYS.SIZE }),
        tag: symbol,
        renderCell: (row: RowData) => (
          <Styled.SizeOutput
            type={OutputType.Asset}
            value={row.size}
            fractionDigits={stepSizeDecimals}
            histogramSide={histogramSide}
            useGrouping={false}
          />
        ),
      },
      {
        columnKey: 'price',
        getCellValue: (row: RowData) => row.price,
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        tag: 'USD',
        renderCell: (row: RowData) => (
          <OrderbookTradesOutput
            type={OutputType.Fiat}
            value={row.price}
            fractionDigits={tickSizeDecimals}
            useGrouping={false}
          />
        ),
      },
      !isTablet && timeColumn,
    ].filter(isTruthy);
  }, [stepSizeDecimals, tickSizeDecimals, symbol, histogramSide, stringGetter]);

  return (
    <Styled.LiveTradesTable
      className={className}
      key="live-trades"
      label="Recent Trades"
      data={rows}
      columns={columns}
      getRowKey={(row: RowData) => `${row.key}`}
      getRowAttributes={(row: RowData) => ({
        'data-side': row.side,
        style: {
          '--histogram-bucket-size': Math.min(
            ((row.price * row.size) / LARGE_TRADE_USD_VALUE) * MAX_ORDERBOOK_BAR_SIZE,
            MAX_ORDERBOOK_BAR_SIZE
          ),
        },
      })}
      histogramSide={histogramSide}
      selectionBehavior="replace"
      slotEmpty={<LoadingSpace id="live-trades-loading" />}
      withScrollSnapRows
      withScrollSnapColumns
      withFocusStickyRows
      withInnerBorders={isTablet}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TimeOutput = styled(OrderbookTradesOutput)`
  color: var(--color-text-0);
  font-feature-settings: var(--fontFeature-monoNumbers);
`;

Styled.SideOutput = styled(Output)`
  color: var(--accent-color);
`;

Styled.SizeOutput = styled(Output)<StyleProps>`
  color: var(--accent-color);

  @media ${breakpoints.tablet} {
    color: var(--color-text-1);
  }
`;

Styled.LiveTradesTable = styled(OrderbookTradesTable)<StyleProps>`
  tr {
    --histogram-bucket-size: 1;

    &[data-side=${OrderSide.BUY}] {
      --accent-color: var(--color-positive);
    }
    &[data-side=${OrderSide.SELL}] {
      --accent-color: var(--color-negative);
    }

    td:first-child {
      &:before,
      &:after {
        content: '';
        inset: 1px -2px;

        position: absolute;

        ${({ histogramSide }) =>
          histogramSide === 'left'
            ? css`
                right: auto;
              `
            : css`
                left: auto;
              `}
      }

      /* Animation
        @media (prefers-reduced-motion: no-preference) {
          will-change: width;
          transition: var(--ease-out-expo) 0.3s, width var(--ease-in-out-expo) 0.5s;
        } */

      /* Histogram: Size bar */
      &:before {
        width: calc(var(--histogram-bucket-size) * var(--histogram-width));
        border-radius: 2px;

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
          animation: ${keyframes`
          20% {
            opacity: 0.6;
          }
        `} 0.5s;
        }
      }
    }
  }

  @media ${breakpoints.tablet} {
    --tableCell-padding: 0.3em 1em;

    font-size: 0.875em;
  }
`;
