import { useCallback, useMemo, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints, useStringGetter } from '@/hooks';
import {
  useCalculateOrderbookData,
  useCenterOrderbook,
  useDrawOrderbookHistograms,
  useSpreadRowScrollListener,
} from '@/hooks/orderbook';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';
import { setTradeFormInputs } from '@/state/inputs';
import { getCurrentInput } from '@/state/inputsSelectors';

import { Canvas } from '@/components/Canvas';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Tag } from '@/components/Tag';

import { Row, type RowData } from './Orderbook/OrderbookRow';
import { SpreadRow } from './Orderbook/SpreadRow';

const ORDERBOOK_MAX_ROWS_PER_SIDE = 35;

type ElementProps = {
  maxRowsPerSide?: number;
  layout?: 'vertical' | 'horizontal';
};

type StyleProps = {
  hideHeader?: boolean;
  histogramSide?: 'left' | 'right';
  className?: string;
};

const getEmptyRow = (side: 'bid' | 'ask') => ({
  side,
  size: undefined,
  price: undefined,
  offset: 0,
  depth: undefined,
});

export const Orderbook = ({
  maxRowsPerSide = ORDERBOOK_MAX_ROWS_PER_SIDE,
}: ElementProps & StyleProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const showMineColumn = useSelector(calculateCanViewAccount) && !isTablet;
  const currentInput = useSelector(getCurrentInput);
  const { id = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { stepSizeDecimals, tickSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const { asks, bids, spread, spreadPercent, histogramRange, hasOrderbook } =
    useCalculateOrderbookData({
      maxRowsPerSide,
    });

  const { askLevels, asksSlice, bidLevels, bidsSlice, numRows } = useMemo(() => {
    const bidsSlice = bids.slice(0, maxRowsPerSide).reverse();
    const asksSlice = asks.slice(0, maxRowsPerSide);

    const numRows = maxRowsPerSide; // Math.max(bidsSlice.length, asksSlice.length);

    if (asksSlice.length < numRows) {
      const emptyRows = new Array(numRows - asksSlice.length).fill(getEmptyRow('ask'));
      asksSlice.push(...emptyRows);
    } else if (bidsSlice.length < numRows) {
      const emptyRows = new Array(numRows - bidsSlice.length).fill(getEmptyRow('bid'));
      bidsSlice.unshift(...emptyRows);
    }

    const askLevels = new Set(asksSlice.map(({ price }: { price: number }) => price));
    const bidLevels = new Set(bidsSlice.map(({ price }: { price: number }) => price));

    return { askLevels, asksSlice, bidLevels, bidsSlice, numRows };
  }, [asks, bids]);

  const orderbookRef = useRef<HTMLDivElement>(null);
  useCenterOrderbook({ orderbookRef, marketId: id });

  /**
   * Display top or bottom spreadRow when center spreadRow is off screen
   */
  const spreadRowRef = useRef<HTMLDivElement>(null);

  const displaySide = useSpreadRowScrollListener({
    orderbookRef,
    spreadRowRef,
  });

  /**
   * Row action and hover
   */
  const onRowAction = useCallback(
    (price: Nullable<number>) => {
      if (currentInput === 'trade' && price) {
        dispatch(setTradeFormInputs({ limitPriceInput: price?.toString() }));
      }
    },
    [currentInput]
  );

  const [hoveredRow, setHoveredRow] = useState<{
    idx: number;
    side: 'bid' | 'ask';
  }>();

  const { canvasRef: asksCanvasRef } = useDrawOrderbookHistograms({
    data: asksSlice.reverse(),
    histogramRange,
    stepSizeDecimals,
    tickSizeDecimals,
    hoveredRow: hoveredRow?.side === 'ask' ? hoveredRow.idx : undefined,
  });

  const { canvasRef: bidsCanvasRef } = useDrawOrderbookHistograms({
    data: bidsSlice.reverse(),
    histogramRange,
    stepSizeDecimals,
    tickSizeDecimals,
    hoveredRow: hoveredRow?.side === 'bid' ? hoveredRow.idx : undefined,
  });

  return (
    <$OrderbookContainer>
      <$OrderbookContent isLoading={!hasOrderbook}>
        <$Header>
          <span>
            {stringGetter({ key: STRING_KEYS.SIZE })} {id && <Tag>{id}</Tag>}
          </span>
          <span>
            {stringGetter({ key: STRING_KEYS.PRICE })} <Tag>USD</Tag>
          </span>
          <span>{showMineColumn && stringGetter({ key: STRING_KEYS.MINE })}</span>
        </$Header>
        {displaySide === 'top' && (
          <$SpreadRow
            side="top"
            spread={spread}
            spreadPercent={spreadPercent}
            tickSizeDecimals={tickSizeDecimals}
          />
        )}
        <$OrderbookWrapper ref={orderbookRef}>
          {!hasOrderbook ? (
            <LoadingSpace id="orderbook" />
          ) : (
            <>
              <$OrderbookSideContainer
                numRows={numRows}
                side="ask"
                onMouseLeave={() => setHoveredRow(undefined)}
              >
                <$HistogramCanvas
                  ref={asksCanvasRef}
                  width={asksCanvasRef.current?.clientWidth ?? 0}
                  height={asksCanvasRef.current?.clientHeight ?? 0}
                />

                {asksSlice.map((row: RowData, idx) => (
                  <$Row
                    key={idx}
                    title={row.price ? `${row.price}` : undefined}
                    onClick={() => (row.price ? onRowAction(row.price) : {})}
                    onMouseOver={(e) => {
                      setHoveredRow({ idx, side: 'ask' });
                    }}
                  />
                ))}
              </$OrderbookSideContainer>

              <SpreadRow
                ref={spreadRowRef}
                spread={spread}
                spreadPercent={spreadPercent}
                tickSizeDecimals={tickSizeDecimals}
              />

              <$OrderbookSideContainer
                numRows={numRows}
                side="bid"
                onMouseLeave={() => setHoveredRow(undefined)}
              >
                <$HistogramCanvas
                  ref={bidsCanvasRef}
                  width={bidsCanvasRef.current?.clientWidth ?? 0}
                  height={bidsCanvasRef.current?.clientHeight ?? 0}
                />

                {bidsSlice.map((row: RowData, idx) => (
                  <$Row
                    key={idx}
                    title={row.price ? `${row.price}` : undefined}
                    onClick={() => (row.price ? onRowAction(row.price) : {})}
                    onMouseOver={(e) => {
                      setHoveredRow({ idx, side: 'bid' });
                    }}
                  />
                ))}
              </$OrderbookSideContainer>
            </>
          )}
        </$OrderbookWrapper>
        {displaySide === 'bottom' && (
          <$SpreadRow
            side="bottom"
            spread={spread}
            spreadPercent={spreadPercent}
            tickSizeDecimals={tickSizeDecimals}
          />
        )}
      </$OrderbookContent>
    </$OrderbookContainer>
  );
};

const $OrderbookContainer = styled.div`
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  overflow: hidden;
`;

const $OrderbookContent = styled.div<{ isLoading?: boolean }>`
  max-height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  ${({ isLoading }) => isLoading && 'flex: 1;'}
`;

const $Header = styled(Row)`
  height: 2rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-0);
`;

const $OrderbookWrapper = styled.div`
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
`;

const $OrderbookSideContainer = styled.div<{ numRows: number; side: 'bid' | 'ask' }>`
  ${({ numRows }) => css`
    min-height: calc(${numRows} * 1.25rem);
  `}

  ${({ side }) => css`
    --accent-color: ${side === 'bid' ? 'var(--color-positive)' : 'var(--color-negative)'};
  `}
  position: relative;
`;

const $HistogramCanvas = styled(Canvas)`
  width: 100%;
  height: 100%;

  position: absolute;
  top: 0;
  right: 0;

  font-feature-settings: var(--fontFeature-monoNumbers);
`;

const $Row = styled(Row)<{ onClick?: () => void }>`
  ${({ onClick }) => (onClick ? 'cursor: pointer;' : 'cursor: default;')}
`;

const $SpreadRow = styled(SpreadRow)`
  position: absolute;
`;
