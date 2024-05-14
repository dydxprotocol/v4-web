import { forwardRef, useCallback, useMemo, useRef } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { Nullable, type PerpetualMarketOrderbookLevel } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { ORDERBOOK_HEIGHT, ORDERBOOK_MAX_ROWS_PER_SIDE } from '@/constants/orderbook';

import { useStringGetter } from '@/hooks';
import {
  useCalculateOrderbookData,
  useCenterOrderbook,
  useDrawOrderbook,
  useSpreadRowScrollListener,
} from '@/hooks/Orderbook';

import { Canvas } from '@/components/Canvas';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Tag } from '@/components/Tag';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { setTradeFormInputs } from '@/state/inputs';
import { getCurrentInput } from '@/state/inputsSelectors';
import { getCurrentMarketConfig, getCurrentMarketId } from '@/state/perpetualsSelectors';

import { OrderbookRow, SpreadRow } from './OrderbookRow';

type ElementProps = {
  maxRowsPerSide?: number;
  layout?: 'vertical' | 'horizontal';
};

type StyleProps = {
  hideHeader?: boolean;
  histogramSide?: 'left' | 'right';
  className?: string;
};

export const CanvasOrderbook = forwardRef(
  (
    {
      histogramSide = 'right',
      maxRowsPerSide = ORDERBOOK_MAX_ROWS_PER_SIDE,
    }: ElementProps & StyleProps,
    ref
  ) => {
    const { asks, bids, hasOrderbook, histogramRange, spread, spreadPercent } =
      useCalculateOrderbookData({
        maxRowsPerSide,
      });

    const stringGetter = useStringGetter();
    const currentMarket = useSelector(getCurrentMarketId) ?? '';
    const currentMarketConfig = useSelector(getCurrentMarketConfig, shallowEqual);
    const { id = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};

    const { tickSizeDecimals = 2 } = currentMarketConfig ?? {};

    /**
     * Slice asks and bids to maxRowsPerSide using empty rows
     */
    const { asksSlice, bidsSlice } = useMemo(() => {
      let asksSlice: Array<PerpetualMarketOrderbookLevel | undefined> = [];
      const emptyAskRows =
        asks.length < maxRowsPerSide
          ? new Array<undefined>(maxRowsPerSide - asks.length).fill(undefined)
          : [];
      asksSlice = [...emptyAskRows, ...asks.reverse()];

      let bidsSlice: Array<PerpetualMarketOrderbookLevel | undefined> = [];
      const emptyBidRows =
        bids.length < maxRowsPerSide
          ? new Array<undefined>(maxRowsPerSide - bids.length).fill(undefined)
          : [];
      bidsSlice = [...bids, ...emptyBidRows];

      return {
        asksSlice,
        bidsSlice,
      };
    }, [asks, bids]);

    const orderbookRef = useRef<HTMLDivElement>(null);
    useCenterOrderbook({ orderbookRef, marketId: currentMarket });

    /**
     * Display top or bottom spreadRow when center spreadRow is off screen
     */
    const spreadRowRef = useRef<HTMLDivElement>(null);

    const displaySide = useSpreadRowScrollListener({
      orderbookRef,
      spreadRowRef,
    });

    /**
     * Row action
     */
    const currentInput = useSelector(getCurrentInput);
    const dispatch = useDispatch();
    const onRowAction = useCallback(
      (price: Nullable<number>) => {
        if (currentInput === 'trade' && price) {
          dispatch(setTradeFormInputs({ limitPriceInput: price?.toString() }));
        }
      },
      [currentInput]
    );

    const { canvasRef: asksCanvasRef } = useDrawOrderbook({
      data: [...asksSlice].reverse(),
      histogramRange,
      histogramSide,
      side: 'ask',
    });

    const { canvasRef: bidsCanvasRef } = useDrawOrderbook({
      data: bidsSlice,
      histogramRange,
      histogramSide,
      side: 'bid',
    });

    return (
      <$OrderbookContainer ref={ref}>
        <$OrderbookContent $isLoading={!hasOrderbook}>
          <$Header>
            <span>
              {stringGetter({ key: STRING_KEYS.SIZE })} {id && <Tag>{id}</Tag>}
            </span>
            <span>
              {stringGetter({ key: STRING_KEYS.PRICE })} <Tag>USD</Tag>
            </span>
            <span>{stringGetter({ key: STRING_KEYS.MINE })}</span>
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
            <$OrderbookSideContainer $side="asks">
              <$HoverRows $bottom>
                {asksSlice.map((row: PerpetualMarketOrderbookLevel | undefined, idx) =>
                  row ? (
                    <$Row
                      key={idx}
                      title={`${row.price}`}
                      onClick={() => {
                        onRowAction(row.price);
                      }}
                    />
                  ) : (
                    <$Row key={idx} />
                  )
                )}
              </$HoverRows>
              <$OrderbookCanvas ref={asksCanvasRef} width="100%" height="100%" />
            </$OrderbookSideContainer>

            <SpreadRow
              ref={spreadRowRef}
              spread={spread?.toNumber()}
              spreadPercent={spreadPercent}
              tickSizeDecimals={tickSizeDecimals}
            />

            <$OrderbookSideContainer $side="bids">
              <$HoverRows>
                {bidsSlice.map((row: PerpetualMarketOrderbookLevel | undefined, idx) =>
                  row ? (
                    <$Row
                      key={idx}
                      title={`${row.price}`}
                      onClick={
                        row?.price
                          ? () => {
                              onRowAction(row.price);
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <$Row key={idx} />
                  )
                )}
              </$HoverRows>
              <$OrderbookCanvas ref={bidsCanvasRef} width="100%" height="100%" />
            </$OrderbookSideContainer>
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
        {!hasOrderbook && <LoadingSpace id="canvas-orderbook" />}
      </$OrderbookContainer>
    );
  }
);
const $OrderbookContainer = styled.div`
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  overflow: hidden;
`;

const $OrderbookContent = styled.div<{ $isLoading?: boolean }>`
  max-height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  ${({ $isLoading }) => $isLoading && 'flex: 1;'}
`;

const $Header = styled(OrderbookRow)`
  height: 2rem;
  border-bottom: var(--border);
  color: var(--color-text-0);
`;

const $OrderbookWrapper = styled.div`
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
`;

const $OrderbookSideContainer = styled.div<{ $side: 'bids' | 'asks' }>`
  min-height: ${ORDERBOOK_HEIGHT}px;
  ${({ $side }) => css`
    --accent-color: ${$side === 'bids' ? 'var(--color-positive)' : 'var(--color-negative)'};
  `}
  position: relative;
`;

const $OrderbookCanvas = styled(Canvas)`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
  font-feature-settings: var(--fontFeature-monoNumbers);
`;

const $HoverRows = styled.div<{ $bottom?: boolean }>`
  position: absolute;
  width: 100%;

  ${({ $bottom }) => $bottom && 'bottom: 0;'}
`;

const $Row = styled(OrderbookRow)<{ onClick?: () => void }>`
  ${({ onClick }) =>
    onClick
      ? css`
          cursor: pointer;

          &:hover {
            background-color: var(--color-layer-4);
            filter: darkness(0.1);
          }
        `
      : css`
          cursor: default;
        `}
`;

const $SpreadRow = styled(SpreadRow)`
  position: absolute;
`;
