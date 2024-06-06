import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';

import { clamp } from 'lodash';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import {
  MarketOrderbookGrouping,
  Nullable,
  OrderbookGrouping,
  type PerpetualMarketOrderbookLevel,
} from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ORDERBOOK_HEIGHT, ORDERBOOK_MAX_ROWS_PER_SIDE } from '@/constants/orderbook';

import { useCenterOrderbook } from '@/hooks/Orderbook/useCenterOrderbook';
import { useDrawOrderbook } from '@/hooks/Orderbook/useDrawOrderbook';
import { useCalculateOrderbookData } from '@/hooks/Orderbook/useOrderbookValues';
import { useSpreadRowScrollListener } from '@/hooks/Orderbook/useSpreadRowScrollListener';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Canvas } from '@/components/Canvas';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { setTradeFormInputs } from '@/state/inputs';
import { getCurrentInput } from '@/state/inputsSelectors';
import { getCurrentMarketConfig, getCurrentMarketId } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';

import { OrderbookRow, SpreadRow } from './OrderbookRow';

type ElementProps = {
  maxRowsPerSide?: number;
};

type StyleProps = {
  histogramSide?: 'left' | 'right';
};

export const CanvasOrderbook = forwardRef(
  (
    {
      histogramSide = 'right',
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
    const { id } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};

    const { tickSizeDecimals = 2 } = currentMarketConfig ?? {};

    /**
     * Slice asks and bids to maxRowsPerSide using empty rows
     */
    const { asksSlice, bidsSlice } = useMemo(() => {
      let newAsksSlice: Array<PerpetualMarketOrderbookLevel | undefined> = [];
      const emptyAskRows =
        asks.length < maxRowsPerSide
          ? new Array<undefined>(maxRowsPerSide - asks.length).fill(undefined)
          : [];
      newAsksSlice = [...emptyAskRows, ...asks.reverse()];

      let newBidsSlice: Array<PerpetualMarketOrderbookLevel | undefined> = [];
      const emptyBidRows =
        bids.length < maxRowsPerSide
          ? new Array<undefined>(maxRowsPerSide - bids.length).fill(undefined)
          : [];
      newBidsSlice = [...bids, ...emptyBidRows];

      return {
        asksSlice: newAsksSlice,
        bidsSlice: newBidsSlice,
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
      data: [...asksSlice].reverse(),
      histogramRange,
      histogramSide,
      displayUnit,
      side: 'ask',
    });

    const { canvasRef: bidsCanvasRef } = useDrawOrderbook({
      data: bidsSlice,
      histogramRange,
      histogramSide,
      displayUnit,
      side: 'bid',
    });

    const usdTag = <Tag>USD</Tag>;
    const assetTag = id ? <Tag>{id}</Tag> : undefined;
    return (
      <$OrderbookContainer ref={ref}>
        <$OrderbookContent $isLoading={!hasOrderbook}>
          <$OrderbookControls
            assetName={id}
            selectedUnit={displayUnit}
            setSelectedUnit={setDisplayUnit}
            grouping={currentGrouping}
          />
          <$Header>
            <span>
              {stringGetter({ key: STRING_KEYS.PRICE })} {usdTag}
            </span>
            <span>
              {stringGetter({ key: STRING_KEYS.SIZE })} {displayUnit === 'fiat' ? usdTag : assetTag}
            </span>
            <span>
              {stringGetter({ key: STRING_KEYS.TOTAL })}{' '}
              {displayUnit === 'fiat' ? usdTag : assetTag}
            </span>
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

type OrderbookControlsProps = {
  className?: string;
  assetName?: string;
  selectedUnit: 'fiat' | 'asset';
  setSelectedUnit(val: 'fiat' | 'asset'): void;
  grouping: Nullable<MarketOrderbookGrouping>;
};
const OrderbookControls = ({
  className,
  assetName,
  selectedUnit,
  setSelectedUnit,
  grouping,
}: OrderbookControlsProps) => {
  // const stringGetter = useStringGetter();
  const modifyScale = useCallback(
    (direction: number) => {
      const start = grouping?.multiplier.ordinal ?? 0;
      const end = clamp(start + direction, 0, 3);
      abacusStateManager.modifyOrderbookLevel(
        OrderbookGrouping.values().find((v) => v.ordinal === end)!
      );
    },
    [grouping?.multiplier.ordinal]
  );
  return (
    <$OrderbookControlsContainer className={className}>
      <$OrderbookUnitControl>
        {/* TODO - localization */}
        <$OrderbookLabel>Units</$OrderbookLabel>
        <ToggleGroup
          items={[
            { label: assetName ?? '', value: 'asset' as const },
            { label: 'USD', value: 'fiat' as const },
          ]}
          shape={ButtonShape.Rectangle}
          value={selectedUnit}
          onValueChange={setSelectedUnit}
        />
      </$OrderbookUnitControl>
      <$OrderbookZoomControl>
        <Output value={grouping?.tickSize} type={OutputType.Fiat} />
        <$ButtonGroup>
          <Button
            size={ButtonSize.XSmall}
            shape={ButtonShape.Square}
            onClick={() => modifyScale(1)}
          >
            -
          </Button>
          <Button
            size={ButtonSize.XSmall}
            shape={ButtonShape.Square}
            onClick={() => modifyScale(-1)}
          >
            +
          </Button>
        </$ButtonGroup>
      </$OrderbookZoomControl>
    </$OrderbookControlsContainer>
  );
};
const $OrderbookControls = styled(OrderbookControls)`
  border-bottom: var(--border);
  color: var(--color-text-0);
  font: var(--font-small-book);
`;
const $OrderbookLabel = styled.div`
  display: inline-flex;
  align-items: center;
`;
const $OrderbookControlsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: var(--border-width);
  > * {
    padding: 0.5rem;
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }
`;
const $ButtonGroup = styled.div`
  display: flex;
  gap: 0.25rem;
  > button {
    --button-font: var(--font-medium-book);
  }
`;
const $OrderbookUnitControl = styled.div`
  display: flex;
  gap: 0.5rem;
`;
const $OrderbookZoomControl = styled.div`
  gap: 1rem;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 0 0 var(--border-width) var(--border-color);
`;

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
