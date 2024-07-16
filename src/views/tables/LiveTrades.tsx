import { useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';
import styled, { css, keyframes } from 'styled-components';

import { MarketTrade } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketConfig, getCurrentMarketLiveTrades } from '@/state/perpetualsSelectors';

import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
import { isTruthy } from '@/lib/isTruthy';
import { getSelectedOrderSide } from '@/lib/tradeData';

import { OrderbookTradesOutput, OrderbookTradesTable } from './OrderbookTradesTable';

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
  const currentMarketAssetData = useAppSelector(getCurrentMarketAssetData, shallowEqual);
  const currentMarketConfig = useAppSelector(getCurrentMarketConfig, shallowEqual);
  const currentMarketLiveTrades =
    useAppSelector(getCurrentMarketLiveTrades, shallowEqual) ?? EMPTY_ARR;

  const { id = '' } = currentMarketAssetData ?? {};
  const { stepSizeDecimals, tickSizeDecimals, stepSize } = currentMarketConfig ?? {};
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

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
        <$TimeOutput type={OutputType.Time} value={row.createdAtMilliseconds} />
      ),
    };
    return [
      isTablet && timeColumn,
      isTablet && {
        columnKey: 'side',
        getCellValue: (row: RowData) => row.size,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: (row: RowData) => (
          <$SideOutput
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
        tag: id,
        renderCell: (row: RowData) => (
          <$SizeOutput
            type={OutputType.CompactNumber}
            value={row.size}
            histogramSide={histogramSide}
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
  }, [stepSizeDecimals, tickSizeDecimals, id, histogramSide, stringGetter]);

  return (
    <$LiveTradesTable
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
const $TimeOutput = styled(OrderbookTradesOutput)`
  color: var(--color-text-0);
  font-feature-settings: var(--fontFeature-monoNumbers);
`;

const $SideOutput = styled(Output)`
  color: var(--accent-color);
`;

const $SizeOutput = styled(Output)<StyleProps>`
  color: var(--accent-color);

  @media ${breakpoints.tablet} {
    color: var(--color-text-1);
  }
`;

const liveTradesTableType = getSimpleStyledOutputType(OrderbookTradesTable, {} as StyleProps);
const $LiveTradesTable = styled(OrderbookTradesTable)<StyleProps>`
  background: var(--color-layer-2);

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
` as typeof liveTradesTableType;
