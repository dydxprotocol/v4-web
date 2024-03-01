import { useEffect, useMemo, useRef } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import type { PerpetualMarketOrderbookLevel } from '@/constants/abacus';
import { SMALL_USD_DECIMALS, TOKEN_DECIMALS } from '@/constants/numbers';
import {
  ORDERBOOK_ANIMATION_DURATION,
  ORDERBOOK_HEIGHT,
  ORDERBOOK_ROW_HEIGHT,
  ORDERBOOK_ROW_PADDING_RIGHT,
  ORDERBOOK_WIDTH,
} from '@/constants/orderbook';

import { useAppThemeAndColorModeContext } from '@/hooks/useAppThemeAndColorMode';

import { getCurrentMarketConfig, getCurrentMarketOrderbookMap } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import {
  getHistogramXValues,
  getRektFromIdx,
  getXByColumn,
  getYForElements,
} from '@/lib/orderbookHelpers';

type ElementProps = {
  data: Array<PerpetualMarketOrderbookLevel | undefined>;
  histogramRange: number;
  side: PerpetualMarketOrderbookLevel['side'];
};

type StyleProps = {
  histogramSide: 'left' | 'right';
};

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
  const currentOrderbookMap = useSelector(getCurrentMarketOrderbookMap, shallowEqual);
  const { stepSizeDecimals = TOKEN_DECIMALS, tickSizeDecimals = SMALL_USD_DECIMALS } =
    useSelector(getCurrentMarketConfig, shallowEqual) || {};
  const prevData = useRef<typeof data>(data);
  const theme = useAppThemeAndColorModeContext();

  /**
   * Scale canvas using device pixel ratio to unblur drawn text
   * @url https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas/65124939#65124939
   * @returns adjusted canvas width/height/rowHeight used in coordinates for drawing
   **/
  const { canvasWidth, canvasHeight, rowHeight } = useMemo(() => {
    const ratio = window.devicePixelRatio || 1;

    if (!canvas) {
      return {
        canvasWidth: ORDERBOOK_WIDTH / devicePixelRatio,
        canvasHeight: ORDERBOOK_HEIGHT / devicePixelRatio,
        rowHeight: ORDERBOOK_ROW_HEIGHT / devicePixelRatio,
      };
    }

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;

    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.font = '12px Satoshi';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.imageSmoothingQuality = 'high';
    }

    return {
      canvasWidth: canvas.width / ratio,
      canvasHeight: canvas.height / ratio,
      rowHeight: ORDERBOOK_ROW_HEIGHT,
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
      linearGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = linearGradient;
    } catch (err) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    }

    ctx.beginPath();

    // Bar
    const { bar: y } = getYForElements({ y: y1, rowHeight });

    if (ctx.roundRect) {
      ctx.roundRect(
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
        textColor = theme.textSecondary;
        break;
      }

      case OrderbookRowAnimationType.NEW: {
        updatedTextColor = side === 'bid' ? theme.positive : theme.negative;
        textColor = theme.textPrimary;
        break;
      }

      default: {
        textColor = theme.textPrimary;
        break;
      }
    }

    // Size text
    if (size) {
      ctx.fillStyle = updatedTextColor ?? textColor;
      ctx.fillText(
        MustBigNumber(size).toFixed(stepSizeDecimals ?? TOKEN_DECIMALS),
        getXByColumn({ canvasWidth, colIdx: 0 }) - ORDERBOOK_ROW_PADDING_RIGHT,
        y
      );
    }

    // Price text
    if (price) {
      ctx.fillStyle = textColor;
      ctx.fillText(
        MustBigNumber(price).toFixed(tickSizeDecimals ?? SMALL_USD_DECIMALS),
        getXByColumn({ canvasWidth, colIdx: 1 }) - ORDERBOOK_ROW_PADDING_RIGHT,
        y
      );
    }

    // Mine text
    if (mine) {
      ctx.fillStyle = textColor;
      ctx.fillText(
        MustBigNumber(mine).toFixed(stepSizeDecimals ?? TOKEN_DECIMALS),
        getXByColumn({ canvasWidth, colIdx: 2 }) - ORDERBOOK_ROW_PADDING_RIGHT,
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
    rowToRender?: PerpetualMarketOrderbookLevel;
    animationType?: OrderbookRowAnimationType;
  }) => {
    if (!rowToRender) return;
    const { depth, mine, price, size } = rowToRender;
    const histogramAccentColor = side === 'bid' ? theme.positiveFaded : theme.negativeFaded;

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
    const mapOfOrderbookPriceLevels =
      side && currentOrderbookMap?.[side === 'ask' ? 'asks' : 'bids'];
    const empty: number[] = [];
    const removed: number[] = [];
    const updated: number[] = [];

    prevData.current.forEach((row, idx) => {
      if (!row) {
        empty.push(idx);
        return;
      }

      if (mapOfOrderbookPriceLevels?.[row.price] === 0) {
        removed.push(idx);
        drawOrderbookRow({
          ctx,
          idx,
          rowToRender: row,
          animationType: OrderbookRowAnimationType.REMOVE,
        });
      } else if (mapOfOrderbookPriceLevels?.[row.price] === row?.size) {
        drawOrderbookRow({
          ctx,
          idx,
          rowToRender: data[idx],
          animationType: OrderbookRowAnimationType.NONE,
        });
      } else {
        updated.push(idx);
        drawOrderbookRow({
          ctx,
          idx,
          rowToRender: row,
          animationType: OrderbookRowAnimationType.NEW,
        });
      }
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
    }, ORDERBOOK_ANIMATION_DURATION);

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
    currentOrderbookMap,
  ]);

  return { canvasRef };
};
