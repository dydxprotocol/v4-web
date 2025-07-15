import { forwardRef, useCallback, useMemo, useRef } from 'react';

import { TradeFormType } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { ORDERBOOK_MAX_ROWS_PER_SIDE, ORDERBOOK_ROW_HEIGHT } from '@/constants/orderbook';

import { useCenterOrderbook } from '@/hooks/Orderbook/useCenterOrderbook';
import { useDrawOrderbook } from '@/hooks/Orderbook/useDrawOrderbook';
import { useOrderbookMiddleRowScrollListener } from '@/hooks/Orderbook/useOrderbookMiddleRowScrollListener';
import { useCalculateOrderbookData } from '@/hooks/Orderbook/useOrderbookValues';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Canvas } from '@/components/Canvas';
import { DisplayUnitTag } from '@/components/DisplayUnitTag';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Tag } from '@/components/Tag';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { closePositionFormActions } from '@/state/closePositionForm';
import { tradeFormActions } from '@/state/tradeForm';
import { getCurrentSelectedFormSummary, getCurrentTradePageForm } from '@/state/tradeFormSelectors';

import { assertNever } from '@/lib/assertNever';
import { MustBigNumber } from '@/lib/numbers';
import { Nullable, orEmptyObj } from '@/lib/typeUtils';

import { OrderbookControls } from './OrderbookControls';
import { OrderbookMiddleRow, OrderbookRow } from './OrderbookRow';

type ElementProps = {
  className?: string;
  rowsPerSide?: number;
  layout?: 'vertical' | 'horizontal';
};

type StyleProps = {
  histogramSide?: 'left' | 'right';
  hideHeader?: boolean;
};

export const CanvasOrderbook = forwardRef(
  (
    {
      className,
      histogramSide = 'right',
      hideHeader = false,
      layout = 'vertical',
      rowsPerSide = ORDERBOOK_MAX_ROWS_PER_SIDE,
    }: ElementProps & StyleProps,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    const {
      asks,
      bids,
      spread,
      spreadPercent,
      hasOrderbook,
      histogramRange,
      groupingTickSize,
      groupingTickSizeDecimals,
      modifyGroupingMultiplier,
    } = useCalculateOrderbookData({
      rowsPerSide,
    });

    const {
      assetId: id,
      ticker,
      tickSizeDecimals = USD_DECIMALS,
    } = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo));

    const stringGetter = useStringGetter();

    /**
     * Slice asks and bids to rowsPerSide using empty rows
     */
    const { asksSlice, bidsSlice } = useMemo(() => {
      const emptyAskRows =
        asks.length < rowsPerSide
          ? new Array<undefined>(rowsPerSide - asks.length).fill(undefined)
          : [];

      const newAsksSlice = [...asks, ...emptyAskRows];

      const emptyBidRows =
        bids.length < rowsPerSide
          ? new Array<undefined>(rowsPerSide - bids.length).fill(undefined)
          : [];
      const newBidsSlice = [...bids, ...emptyBidRows];

      return {
        asksSlice: layout === 'horizontal' ? newAsksSlice.reverse() : newAsksSlice,
        bidsSlice: newBidsSlice,
      };
    }, [asks, bids, layout, rowsPerSide]);

    const orderbookRef = useRef<HTMLDivElement>(null);

    useCenterOrderbook({
      orderbookRef,
      marketId: ticker ?? '',
      disabled: layout === 'horizontal',
    });

    /**
     * Display top or bottom middleRow when center middleRow is off screen
     */
    const orderbookMiddleRowRef = useRef<HTMLDivElement>(null);

    const displaySide = useOrderbookMiddleRowScrollListener({
      orderbookRef,
      orderbookMiddleRowRef,
    });

    /**
     * Row action
     */
    const dispatch = useAppDispatch();
    const currentForm = useAppSelector(getCurrentTradePageForm);
    const currentFormType = useAppSelector(getCurrentSelectedFormSummary).summary.effectiveTrade
      .type;
    const currentFormIsLimit =
      currentFormType === TradeFormType.LIMIT || currentFormType === TradeFormType.TRIGGER_LIMIT;
    const onRowAction = useCallback(
      (price: Nullable<number>) => {
        if (!currentFormIsLimit) {
          return;
        }
        if (price) {
          const priceNumber = MustBigNumber(price).toFixed(tickSizeDecimals);
          // avoid scientific notation for when converting small number to string
          if (currentForm === 'TRADE') {
            dispatch(tradeFormActions.setLimitPrice(priceNumber));
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (currentForm === 'CLOSE_POSITION') {
            dispatch(closePositionFormActions.setLimitPrice(priceNumber));
          } else {
            assertNever(currentForm);
          }
        }
      },
      [currentForm, currentFormIsLimit, dispatch, tickSizeDecimals]
    );

    const displayUnit = useAppSelector(getSelectedDisplayUnit);

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

    const asksOrderbook = (
      <$OrderbookSideContainer $side="asks" $rows={rowsPerSide}>
        <$HoverRows $bottom={layout !== 'horizontal'}>
          {[...asksSlice].reverse().map((row, idx) =>
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
      <$OrderbookSideContainer $side="bids" $rows={rowsPerSide}>
        <$HoverRows>
          {bidsSlice.map((row, idx) =>
            row ? (
              <$Row
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                title={`${row.price}`}
                onClick={
                  row.price
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
      <div className={className} ref={ref} tw="flex flex-1 flex-col overflow-hidden">
        <$OrderbookContent $isLoading={!hasOrderbook}>
          {!hideHeader && (
            <OrderbookControls
              assetId={id}
              groupingTickSize={groupingTickSize}
              groupingTickSizeDecimals={groupingTickSizeDecimals}
              modifyGrouping={modifyGroupingMultiplier}
            />
          )}
          {!hideHeader && (
            <$OrderbookRow tw="h-1.75 text-color-text-0">
              <span>
                {stringGetter({ key: STRING_KEYS.PRICE })} <Tag>USD</Tag>
              </span>
              <span>
                {stringGetter({ key: STRING_KEYS.SIZE })}{' '}
                <DisplayUnitTag assetId={id} entryPoint="orderbookAssetTag" />
              </span>
              <span>
                {stringGetter({ key: STRING_KEYS.TOTAL })}{' '}
                <DisplayUnitTag assetId={id} entryPoint="orderbookAssetTag" />
              </span>
            </$OrderbookRow>
          )}

          {(displaySide === 'top' || layout === 'horizontal') && (
            <$OrderbookMiddleRow
              side="top"
              spread={spread}
              spreadPercent={spreadPercent}
              tickSizeDecimals={tickSizeDecimals}
              isHeader={layout === 'horizontal'}
            />
          )}
          {layout === 'vertical' ? (
            <>
              <div ref={orderbookRef} tw="flex flex-1 flex-col justify-center overflow-y-auto">
                {asksOrderbook}
                <OrderbookMiddleRow
                  spread={spread}
                  spreadPercent={spreadPercent}
                  tickSizeDecimals={tickSizeDecimals}
                  ref={orderbookMiddleRowRef}
                />
                {bidsOrderbook}
              </div>
              {displaySide === 'bottom' && (
                <$OrderbookMiddleRow
                  side="bottom"
                  spread={spread}
                  spreadPercent={spreadPercent}
                  tickSizeDecimals={tickSizeDecimals}
                />
              )}
            </>
          ) : (
            <div tw="grid grid-cols-[1fr_1fr] overflow-y-auto">
              {asksOrderbook}
              {bidsOrderbook}
            </div>
          )}
        </$OrderbookContent>
        {!hasOrderbook && <LoadingSpace id="canvas-orderbook" />}
      </div>
    );
  }
);
const $OrderbookContent = styled.div<{ $isLoading?: boolean }>`
  min-height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  ${({ $isLoading }) => $isLoading && 'flex: 1;'}
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

const $OrderbookRow = styled(OrderbookRow)`
  border-top: var(--border);
  border-bottom: var(--border);
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

const $OrderbookMiddleRow = tw(OrderbookMiddleRow)`absolute`;
