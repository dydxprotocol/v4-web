import { useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import type { PerpetualMarketOrderbookLevel } from '@/constants/abacus';
import { SMALL_USD_DECIMALS, TOKEN_DECIMALS } from '@/constants/numbers';

import { ROW_HEIGHT, ROW_PADDING_RIGHT } from '@/views/CanvasOrderbook/OrderbookRow';

import { getCurrentMarketConfig, getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';
import { getAppTheme } from '@/state/configsSelectors';

import { MustBigNumber } from '@/lib/numbers';

import {
  getHistogramXValues,
  getRektFromIdx,
  getXByColumn,
  getYForElements,
} from '@/lib/orderbookHelpers';

import { Colors } from '@/styles/colors';

type ElementProps = {
  data: Array<PerpetualMarketOrderbookLevel | undefined>;
  histogramRange: number;
  side: PerpetualMarketOrderbookLevel['side'];
};

type StyleProps = {
  histogramSide: 'left' | 'right';
};

export const ORDERBOOK_HEIGHT = 800;
export const ORDERBOOK_WIDTH = 300;

enum OrderbookRowAnimationType {
  REMOVE,
  NEW,
  NONE,
}

export const useDrawOrderbook = ({
  data,
  histogramRange,
  histogramSide,
  side,
}: ElementProps & StyleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef.current;
  const currentOrderbook = useSelector(getCurrentMarketOrderbook, shallowEqual);
  const { stepSizeDecimals = 2, tickSizeDecimals = 2 } =
    useSelector(getCurrentMarketConfig, shallowEqual) || {};
  const prevData = useRef<typeof data>(data);
  const theme = useSelector(getAppTheme, shallowEqual);
  const color = Colors[theme];

  /**
   * Scale canvas using device pixel ratio to unblur drawn text
   * @returns adjusted canvas width/height/rowHeight used in coordinates for drawing
   **/
  const { canvasWidth, canvasHeight, rowHeight } = useMemo(() => {
    const devicePixelRatio = window.devicePixelRatio || 1;

    if (!canvas) {
      return {
        canvasWidth: ORDERBOOK_WIDTH / devicePixelRatio,
        canvasHeight: ORDERBOOK_HEIGHT / devicePixelRatio,
        rowHeight: ROW_HEIGHT / devicePixelRatio,
      };
    }

    const ctx = canvas.getContext('2d');

    const backingStoreRatio: number =
      // @ts-expect-error - Backing store pixel ratio is not defined in types
      (ctx?.webkitBackingStorePixelRatio as number) ||
      // @ts-expect-error - Backing store pixel ratio is not defined in types
      (ctx?.mozBackingStorePixelRatio as number) ||
      // @ts-expect-error - Backing store pixel ratio is not defined in types
      (ctx?.msBackingStorePixelRatio as number) ||
      // @ts-expect-error - Backing store pixel ratio is not defined in types
      (ctx?.oBackingStorePixelRatio as number) ||
      // @ts-expect-error - Backing store pixel ratio is not defined in types
      (ctx?.backingStorePixelRatio as number) ||
      1;

    const ratio = devicePixelRatio / backingStoreRatio;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;

    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.font = '13.5px Satoshi';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.imageSmoothingQuality = 'high';
    }

    return {
      canvasWidth: canvas.width / ratio,
      canvasHeight: canvas.height / ratio,
      rowHeight: ROW_HEIGHT,
    };
  }, [canvas]);

  const drawBars = ({
    barType,
    ctx,
    depthOrSizeValue,
    gradientMultiplier,
    histogramAccentColor,
    histogramSide,
    idx,
  }: {
    barType: 'depth' | 'size';
    ctx: CanvasRenderingContext2D;
    depthOrSizeValue: number;
    gradientMultiplier: number;
    histogramAccentColor: string;
    histogramSide: 'left' | 'right';
    idx: number;
  }) => {
    const { x1, x2, y1, y2 } = getRektFromIdx({
      idx,
      rowHeight,
      canvasWidth,
      canvasHeight,
      side,
    });

    // X values
    const maxHistogramBarWidth = x2 - x1 - (barType === 'size' ? 8 : 2);
    const barWidth = depthOrSizeValue
      ? Math.min((depthOrSizeValue / histogramRange) * maxHistogramBarWidth, maxHistogramBarWidth)
      : 0;

    const { gradient, bar } = getHistogramXValues({
      barWidth,
      canvasWidth,
      gradientMultiplier,
      histogramSide,
    });

    // Gradient
    let linearGradient;

    try {
      linearGradient = ctx.createLinearGradient(gradient.x1, y1, gradient.x2, y2);

      linearGradient.addColorStop(0, histogramAccentColor);
      // linearGradient.addColorStop(0.7, );
      linearGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = linearGradient;
    } catch (err) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    }

    ctx.beginPath();

    // Bar
    const { bar: y } = getYForElements({ y: y1, rowHeight });

    if (ctx.roundRect) {
      ctx.roundRect?.(
        bar.x1,
        y,
        bar.x2,
        rowHeight - 2,
        histogramSide === 'right' ? [2, 0, 0, 2] : [0, 2, 2, 0]
      );
    } else {
      ctx.rect(bar.x1, y, bar.x2, rowHeight - 2);
    }

    ctx.fill();
  };

  const drawText = ({
    animationType = OrderbookRowAnimationType.NONE,
    ctx,
    idx,
    mine,
    price,
    size,
  }: {
    animationType?: OrderbookRowAnimationType;
    ctx: CanvasRenderingContext2D;
    idx: number;
    mine?: number;
    price?: number;
    size?: number;
  }) => {
    const { y1 } = getRektFromIdx({
      idx,
      rowHeight,
      canvasWidth,
      canvasHeight,
      side,
    });

    const { text: y } = getYForElements({ y: y1, rowHeight });

    let textColor: string;
    let updatedTextColor: string | undefined;

    switch (animationType) {
      case OrderbookRowAnimationType.REMOVE: {
        textColor = color.text1;
        break;
      }

      case OrderbookRowAnimationType.NEW: {
        updatedTextColor = side === 'bid' ? color.positive : color.negative;
        textColor = color.text2;
        break;
      }

      default: {
        textColor = color.text2;
        break;
      }
    }

    // Size text
    if (size) {
      ctx.fillStyle = updatedTextColor ?? textColor;
      ctx.fillText(
        MustBigNumber(size).toFixed(stepSizeDecimals ?? TOKEN_DECIMALS),
        getXByColumn({ canvasWidth, colIdx: 0 }) - ROW_PADDING_RIGHT,
        y
      );
    }

    // Price text
    if (price) {
      ctx.fillStyle = textColor;
      ctx.fillText(
        MustBigNumber(price).toFixed(tickSizeDecimals ?? SMALL_USD_DECIMALS),
        getXByColumn({ canvasWidth, colIdx: 1 }) - ROW_PADDING_RIGHT,
        y
      );
    }

    // Mine text
    if (mine) {
      ctx.fillStyle = textColor;
      ctx.fillText(
        MustBigNumber(mine).toFixed(stepSizeDecimals ?? TOKEN_DECIMALS),
        getXByColumn({ canvasWidth, colIdx: 2 }) - ROW_PADDING_RIGHT,
        y
      );
    }
  };

  const drawOrderbookRow = ({
    ctx,
    idx,
    rowToRender,
    animationType = OrderbookRowAnimationType.NONE,
  }: {
    ctx: CanvasRenderingContext2D;
    idx: number;
    rowToRender: PerpetualMarketOrderbookLevel | undefined;
    animationType?: OrderbookRowAnimationType;
  }) => {
    if (!rowToRender) return;
    const { price, size, depth } = rowToRender;
    const mine = undefined;
    const histogramAccentColor = side === 'bid' ? color.fadedGreen : color.fadedRed;

    // Depth Bar
    if (depth) {
      drawBars({
        barType: 'depth',
        ctx,
        depthOrSizeValue: depth,
        gradientMultiplier: 1.3,
        histogramAccentColor,
        histogramSide,
        idx,
      });
    }

    // Size Bar
    drawBars({
      barType: 'size',
      ctx,
      depthOrSizeValue: size,
      gradientMultiplier: 5,
      histogramAccentColor,
      histogramSide,
      idx,
    });

    // Size, Price, Mine
    drawText({
      animationType,
      ctx,
      idx,
      mine,
      price,
      size,
    });
  };

  // Update histograms and row contents on data change
  useEffect(() => {
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;
    // Clear canvas before redraw
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Animate row removal and update
    //  const mapOfOrderbookPriceLevels = currentOrderbook?.[side];
    const empty: number[] = [];
    const removed: number[] = [];
    const updated: number[] = [];

    prevData.current.forEach((row, idx) => {
      if (!row) {
        empty.push(idx);
        return;
      }
      updated.push(idx);
      drawOrderbookRow({
        ctx,
        idx,
        rowToRender: row,
        animationType: OrderbookRowAnimationType.NONE,
      });

      // if (mapOfOrderbookPriceLevels?.[row.price]?.size === '0') {
      //   removed.push(idx);
      //   drawOrderbookRow({
      //     ctx,
      //     idx,
      //     rowToRender: row,
      //     animationType: OrderbookRowAnimationType.REMOVE,
      //   });
      // } else if (mapOfOrderbookPriceLevels?.[row.price]?.size === row?.size) {
      //   drawOrderbookRow({
      //     ctx,
      //     idx,
      //     rowToRender: data[idx],
      //     animationType: OrderbookRowAnimationType.NONE,
      //   });
      // } else {
      //   updated.push(idx);
      //   drawOrderbookRow({
      //     ctx,
      //     idx,
      //     rowToRender: row,
      //     animationType: OrderbookRowAnimationType.NEW,
      //   });
      // }
    });

    setTimeout(() => {
      [...empty, ...removed, ...updated].forEach((idx) => {
        const { x1, y1, x2, y2 } = getRektFromIdx({
          idx,
          rowHeight,
          canvasWidth,
          canvasHeight,
          side,
        });

        ctx.clearRect(x1, y1, x2 - x1, y2 - y1);
        drawOrderbookRow({
          ctx,
          idx,
          rowToRender: data[idx],
        });
      });
    }, 400);

    prevData.current = data;
  }, [
    canvasHeight,
    canvasWidth,
    rowHeight,
    data,
    histogramRange,
    stepSizeDecimals,
    tickSizeDecimals,
    histogramSide,
    side,
    theme,
  ]);

  return { canvasRef };
};
