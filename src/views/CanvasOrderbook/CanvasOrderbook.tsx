import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { Nullable, type PerpetualMarketOrderbookLevel } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { ORDERBOOK_MAX_ROWS_PER_SIDE, ORDERBOOK_ROW_HEIGHT } from '@/constants/orderbook';

import { useCenterOrderbook } from '@/hooks/Orderbook/useCenterOrderbook';
import { useDrawOrderbook } from '@/hooks/Orderbook/useDrawOrderbook';
import { useCalculateOrderbookData } from '@/hooks/Orderbook/useOrderbookValues';
import { useSpreadRowScrollListener } from '@/hooks/Orderbook/useSpreadRowScrollListener';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Canvas } from '@/components/Canvas';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Tag } from '@/components/Tag';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setTradeFormInputs } from '@/state/inputs';
import { getCurrentInput } from '@/state/inputsSelectors';
import {
  getCurrentMarketConfig,
  getCurrentMarketData,
  getCurrentMarketId,
} from '@/state/perpetualsSelectors';

import { OrderbookControls } from './OrderbookControls';
import { OrderbookRow, SpreadRow } from './OrderbookRow';

type ElementProps = {
  maxRowsPerSide?: number;
  layout?: 'vertical' | 'horizontal';
};

type StyleProps = {
  histogramSide?: 'left' | 'right';
  hideHeader?: boolean;
};

export const CanvasOrderbook = forwardRef(
  (
    {
      histogramSide = 'right',
      hideHeader = false,
      layout = 'vertical',
      maxRowsPerSide = ORDERBOOK_MAX_ROWS_PER_SIDE,
    }: ElementProps & StyleProps,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    const { asks, bids, hasOrderbook, histogramRange, spread, spreadPercent, currentGrouping } =
      useCalculateOrderbookData({
        maxRowsPerSide,
      });

    const stringGetter = useStringGetter();
    const currentMarket = useAppSelector(getCurrentMarketId) ?? '';
    const currentMarketConfig = useAppSelector(getCurrentMarketConfig, shallowEqual);
    const { assetId: id } = useAppSelector(getCurrentMarketData, shallowEqual) ?? {};

    const { tickSizeDecimals = 2 } = currentMarketConfig ?? {};

    /**
     * Slice asks and bids to maxRowsPerSide using empty rows
     */
    const { asksSlice, bidsSlice } = useMemo(() => {
      const emptyAskRows =
        asks.length < maxRowsPerSide
          ? new Array<undefined>(maxRowsPerSide - asks.length).fill(undefined)
          : [];

      const newAsksSlice: Array<PerpetualMarketOrderbookLevel | undefined> = [
        ...emptyAskRows,
        ...asks.reverse(),
      ];

      const emptyBidRows =
        bids.length < maxRowsPerSide
          ? new Array<undefined>(maxRowsPerSide - bids.length).fill(undefined)
          : [];
      const newBidsSlice: Array<PerpetualMarketOrderbookLevel | undefined> = [
        ...bids,
        ...emptyBidRows,
      ];

      return {
        asksSlice: layout === 'horizontal' ? newAsksSlice : newAsksSlice.reverse(),
        bidsSlice: newBidsSlice,
      };
    }, [asks, bids, layout, maxRowsPerSide]);

    const orderbookRef = useRef<HTMLDivElement>(null);
    useCenterOrderbook({
      orderbookRef,
      marketId: currentMarket,
      disabled: layout === 'horizontal',
    });

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
    const currentInput = useAppSelector(getCurrentInput);
    const dispatch = useAppDispatch();
    const onRowAction = useCallback(
      (price: Nullable<number>) => {
        if (currentInput === 'trade' && price) {
          dispatch(setTradeFormInputs({ limitPriceInput: price?.toString() }));
        }
      },
      [currentInput]
    );

    const [displayUnit, setDisplayUnit] = useState<'fiat' | 'asset'>('asset');

    const { canvasRef: asksCanvasRef } = useDrawOrderbook({
      data: asksSlice,
      histogramRange,
      histogramSide,
      displayUnit,
      side: 'ask',
    });

    const { canvasRef: bidsCanvasRef } = useDrawOrderbook({
      data: bidsSlice,
      histogramRange,
      histogramSide: layout === 'horizontal' ? 'left' : histogramSide,
      displayUnit,
      side: 'bid',
    });

    const usdTag = <Tag>USD</Tag>;
    const assetTag = id ? <Tag>{id}</Tag> : undefined;
    const asksOrderbook = (
      <$OrderbookSideContainer $side="asks" $rows={maxRowsPerSide}>
        <$HoverRows $bottom={layout !== 'horizontal'}>
          {[...asksSlice].reverse().map((row: PerpetualMarketOrderbookLevel | undefined, idx) =>
            row ? (
              <$Row
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                title={`${row.price}`}
                onClick={() => {
                  onRowAction(row.price);
                }}
              />
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <$Row key={idx} />
            )
          )}
        </$HoverRows>
        <$OrderbookCanvas ref={asksCanvasRef} width="100%" height="100%" />
      </$OrderbookSideContainer>
    );
    const bidsOrderbook = (
      <$OrderbookSideContainer $side="bids" $rows={maxRowsPerSide}>
        <$HoverRows>
          {bidsSlice.map((row: PerpetualMarketOrderbookLevel | undefined, idx) =>
            row ? (
              <$Row
                // eslint-disable-next-line react/no-array-index-key
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
              // eslint-disable-next-line react/no-array-index-key
              <$Row key={idx} />
            )
          )}
        </$HoverRows>
        <$OrderbookCanvas ref={bidsCanvasRef} width="100%" height="100%" />
      </$OrderbookSideContainer>
    );
    return (
      <$OrderbookContainer ref={ref}>
        <$OrderbookContent $isLoading={!hasOrderbook}>
          {!hideHeader && (
            <OrderbookControls
              assetName={id}
              selectedUnit={displayUnit}
              setSelectedUnit={setDisplayUnit}
              grouping={currentGrouping}
            />
          )}
          {!hideHeader && (
            <$Header>
              <span>
                {stringGetter({ key: STRING_KEYS.PRICE })} {usdTag}
              </span>
              <span>
                {stringGetter({ key: STRING_KEYS.SIZE })}{' '}
                {displayUnit === 'fiat' ? usdTag : assetTag}
              </span>
              <span>
                {stringGetter({ key: STRING_KEYS.TOTAL })}{' '}
                {displayUnit === 'fiat' ? usdTag : assetTag}
              </span>
            </$Header>
          )}

          {(displaySide === 'top' || layout === 'horizontal') && (
            <$SpreadRow
              side="top"
              spread={spread}
              spreadPercent={spreadPercent}
              tickSizeDecimals={tickSizeDecimals}
              isHeader={layout === 'horizontal'}
            />
          )}
          {layout === 'vertical' ? (
            <>
              <$OrderbookWrapper ref={orderbookRef}>
                {asksOrderbook}
                <SpreadRow
                  ref={spreadRowRef}
                  spread={spread?.toNumber()}
                  spreadPercent={spreadPercent}
                  tickSizeDecimals={tickSizeDecimals}
                />
                {bidsOrderbook}
              </$OrderbookWrapper>
              {displaySide === 'bottom' && (
                <$SpreadRow
                  side="bottom"
                  spread={spread}
                  spreadPercent={spreadPercent}
                  tickSizeDecimals={tickSizeDecimals}
                />
              )}
            </>
          ) : (
            <$HorizontalOrderbook>
              {asksOrderbook}
              {bidsOrderbook}
            </$HorizontalOrderbook>
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

const $HorizontalOrderbook = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow-y: auto;
`;

const $OrderbookSideContainer = styled.div<{ $side: 'bids' | 'asks'; $rows: number }>`
  ${({ $rows }) => css`
    min-height: calc(${$rows} * ${ORDERBOOK_ROW_HEIGHT}px);
  `}
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
