import { useEffect, useRef, useState } from 'react';

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

export type Rekt = { x1: number; x2: number; y1: number; y2: number };

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
    useSelector(getCurrentMarketConfig, shallowEqual) ?? {};
  const prevData = useRef<typeof data>(data);
  const theme = useAppThemeAndColorModeContext();

  const rowHeight = ORDERBOOK_ROW_HEIGHT;
  const ratio = window.devicePixelRatio;
  const [canvasWidth, setCanvasWidth] = useState(ORDERBOOK_WIDTH / ratio);
  const [canvasHeight, setCanvasHeight] = useState(ORDERBOOK_HEIGHT / ratio);

  useEffect(() => {
    const scaleCanvas = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const currentRatio = window.devicePixelRatio;
      canvas.width = canvas.offsetWidth * currentRatio;
      canvas.height = canvas.offsetHeight * currentRatio;

      if (ctx) {
        ctx.scale(currentRatio, currentRatio);
        ctx.font = '12px Satoshi';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.imageSmoothingQuality = 'high';
      }

      setCanvasWidth(canvas.width / currentRatio);
      setCanvasHeight(canvas.height / currentRatio);
    };

    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);

    return () => window.removeEventListener('resize', scaleCanvas);
  }, [canvas]);

  const drawBars = ({
    barType,
    ctx,
    depthOrSizeValue,
    gradientMultiplier,
    histogramAccentColor,
    histogramSide: inHistogramSide,
    rekt,
  }: {
    barType: 'depth' | 'size';
    ctx: CanvasRenderingContext2D;
    depthOrSizeValue: number;
    gradientMultiplier: number;
    histogramAccentColor: string;
    histogramSide: 'left' | 'right';
    rekt: Rekt;
  }) => {
    const { x1, x2, y1, y2 } = rekt;

    // X values
    const maxHistogramBarWidth = x2 - x1 - (barType === 'size' ? 8 : 2);
    const barWidth = depthOrSizeValue
      ? Math.min((depthOrSizeValue / histogramRange) * maxHistogramBarWidth, maxHistogramBarWidth)
      : 0;

    const { gradient, bar } = getHistogramXValues({
      barWidth,
      canvasWidth,
      gradientMultiplier,
      histogramSide: inHistogramSide,
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
        inHistogramSide === 'right' ? [2, 0, 0, 2] : [0, 2, 2, 0]
      );
    } else {
      ctx.rect(bar.x1, y, bar.x2, rowHeight - 2);
    }

    ctx.fill();
  };

  const drawText = ({
    animationType = OrderbookRowAnimationType.NONE,
    ctx,
    mine,
    price,
    size,
    rekt,
  }: {
    animationType?: OrderbookRowAnimationType;
    ctx: CanvasRenderingContext2D;
    mine?: number;
    price?: number;
    size?: number;
    rekt: Rekt;
  }) => {
    const { y1 } = rekt;

    const { text: y } = getYForElements({ y: y1, rowHeight });

    let textColor: string;
    let updatedTextColor: string | undefined;

    switch (animationType) {
      case OrderbookRowAnimationType.REMOVE: {
        textColor = theme.textTertiary;
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
    const rekt = getRektFromIdx({
      idx,
      rowHeight,
      canvasWidth,
      canvasHeight,
      side,
    });

    // Depth Bar
    if (depth) {
      drawBars({
        barType: 'depth',
        ctx,
        depthOrSizeValue: depth,
        gradientMultiplier: 1.3,
        histogramAccentColor,
        histogramSide,
        rekt,
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
      rekt,
    });

    // Size, Price, Mine
    drawText({
      animationType,
      ctx,
      mine,
      price,
      size,
      rekt,
    });
  };

  // Update histograms and row contents on data change
  useEffect(() => {
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    // Clear canvas before redraw
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Animate row removal and update
    const mapOfOrderbookPriceLevels =
      side && currentOrderbookMap?.[side === 'ask' ? 'asks' : 'bids'];

    prevData.current.forEach((row, idx) => {
      if (!row) return;

      let animationType = OrderbookRowAnimationType.NEW;

      if (mapOfOrderbookPriceLevels?.[row.price] === 0) {
        animationType = OrderbookRowAnimationType.REMOVE;
      } else if (mapOfOrderbookPriceLevels?.[row.price] === row.size) {
        animationType = OrderbookRowAnimationType.NONE;
      }

      drawOrderbookRow({ ctx, idx, rowToRender: row, animationType });
    });

    setTimeout(() => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      data.forEach((row, idx) => drawOrderbookRow({ ctx, idx, rowToRender: row }));
    }, ORDERBOOK_ANIMATION_DURATION);

    prevData.current = data;
  }, [
    canvasHeight,
    canvasWidth,
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
