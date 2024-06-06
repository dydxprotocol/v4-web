import { useEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { shallowEqual } from 'react-redux';

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

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketConfig, getCurrentMarketOrderbookMap } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import {
  getHistogramXValues,
  getRektFromIdx,
  getXByColumn,
  getYForElements,
} from '@/lib/orderbookHelpers';

import { useLocaleSeparators } from '../useLocaleSeparators';

type ElementProps = {
  data: Array<PerpetualMarketOrderbookLevel | undefined>;
  histogramRange: number;
  side: PerpetualMarketOrderbookLevel['side'];
  displayUnit: 'fiat' | 'asset';
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
  displayUnit,
}: ElementProps & StyleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef.current;
  const currentOrderbookMap = useAppSelector(getCurrentMarketOrderbookMap, shallowEqual);
  const { decimal: LOCALE_DECIMAL_SEPARATOR, group: LOCALE_GROUP_SEPARATOR } =
    useLocaleSeparators();

  const { stepSizeDecimals = TOKEN_DECIMALS, tickSizeDecimals = SMALL_USD_DECIMALS } =
    useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};
  const prevData = useRef<typeof data>(data);
  const theme = useAppThemeAndColorModeContext();

  const rowHeight = ORDERBOOK_ROW_HEIGHT;
  const ratio = window.devicePixelRatio;
  const [canvasWidth, setCanvasWidth] = useState(ORDERBOOK_WIDTH / ratio);
  const [canvasHeight, setCanvasHeight] = useState(ORDERBOOK_HEIGHT / ratio);

  // Handle resize, sync to state
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

  const drawMineCircle = ({ ctx, rekt }: { ctx: CanvasRenderingContext2D; rekt: Rekt }) => {
    const padding = 15;
    ctx.beginPath();
    ctx.arc(rekt.x1 + padding, (rekt.y1 + rekt.y2) / 2, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#7774FF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#7774FF73';
    ctx.stroke();
  };

  const drawText = ({
    animationType = OrderbookRowAnimationType.NONE,
    ctx,
    depth,
    depthCost,
    price,
    size,
    sizeCost,
    rekt,
  }: {
    animationType?: OrderbookRowAnimationType;
    ctx: CanvasRenderingContext2D;
    depth?: number;
    depthCost?: number;
    price?: number;
    size?: number;
    sizeCost?: number;
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

    const format = {
      decimalSeparator: LOCALE_DECIMAL_SEPARATOR,
      ...{
        groupSeparator: LOCALE_GROUP_SEPARATOR,
        groupSize: 3,
        secondaryGroupSize: 0,
        fractionGroupSeparator: ' ',
        fractionGroupSize: 0,
      },
    };

    // Price text
    if (price) {
      ctx.fillStyle = textColor;
      ctx.fillText(
        MustBigNumber(price).toFormat(
          tickSizeDecimals ?? SMALL_USD_DECIMALS,
          BigNumber.ROUND_HALF_UP,
          {
            ...format,
          }
        ),
        getXByColumn({ canvasWidth, colIdx: 0 }) - ORDERBOOK_ROW_PADDING_RIGHT,
        y
      );
    }

    const decimalPlaces =
      displayUnit === 'asset'
        ? stepSizeDecimals ?? TOKEN_DECIMALS
        : tickSizeDecimals ?? SMALL_USD_DECIMALS;

    // Size text
    const displaySize = displayUnit === 'asset' ? size : sizeCost;
    if (displaySize) {
      ctx.fillStyle = updatedTextColor ?? textColor;
      ctx.fillText(
        MustBigNumber(displaySize).toFormat(decimalPlaces, BigNumber.ROUND_HALF_UP, {
          ...format,
        }),
        getXByColumn({ canvasWidth, colIdx: 1 }) - ORDERBOOK_ROW_PADDING_RIGHT,
        y
      );
    }

    // Depth text
    const displayDepth = displayUnit === 'asset' ? depth : depthCost;
    if (displayDepth) {
      ctx.fillStyle = textColor;
      ctx.fillText(
        MustBigNumber(displayDepth).toFormat(decimalPlaces, BigNumber.ROUND_HALF_UP, {
          ...format,
        }),
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
    const { depth, mine, price, size, depthCost, sizeCost } = rowToRender;
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

    if (mine && mine > 0) {
      drawMineCircle({ ctx, rekt });
    }

    // Size, Price, Mine
    drawText({
      animationType,
      ctx,
      depth: depth ?? undefined,
      depthCost,
      sizeCost,
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
    displayUnit,
  ]);

  return { canvasRef };
};
