import { useCallback, useEffect, useRef, useState } from 'react';

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

import { OutputType, formatNumberOutput } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketConfig, getCurrentMarketOrderbookMap } from '@/state/perpetualsSelectors';

import { getConsistentAssetSizeString } from '@/lib/consistentAssetSize';
import {
  getHistogramXValues,
  getRektFromIdx,
  getXByColumn,
  getYForElements,
} from '@/lib/orderbookHelpers';
import { generateFadedColorVariant } from '@/lib/styles';
import { orEmptyObj } from '@/lib/typeUtils';

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
  NONE,
}

const GRADIENT_MULTIPLIER = 1.3;

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
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const marketConfig = orEmptyObj(useAppSelector(getCurrentMarketConfig));
  const stepSizeDecimals = marketConfig.stepSizeDecimals ?? TOKEN_DECIMALS;
  const tickSizeDecimals = marketConfig.tickSizeDecimals ?? SMALL_USD_DECIMALS;
  const stepSize = marketConfig.stepSize ?? 10 ** (-1 * TOKEN_DECIMALS);
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
  }, [canvas, canvas?.offsetHeight, canvas?.height, canvas?.offsetWidth, canvas?.width]);

  const drawBars = useCallback(
    ({
      ctx,
      value,
      gradientMultiplier = GRADIENT_MULTIPLIER,
      histogramAccentColor,
      histogramSide: inHistogramSide,
      rekt,
    }: {
      ctx: CanvasRenderingContext2D;
      value: number;
      gradientMultiplier?: number;
      histogramAccentColor: string;
      histogramSide: 'left' | 'right';
      rekt: Rekt;
    }) => {
      const { x1, x2, y1, y2 } = rekt;

      // X values
      const maxHistogramBarWidth = x2 - x1 - 2;
      const barWidth = value
        ? Math.min((value / histogramRange) * maxHistogramBarWidth, maxHistogramBarWidth)
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
    },
    [canvasWidth, histogramRange, rowHeight]
  );

  const drawMineCircle = useCallback(
    ({ ctx, rekt }: { ctx: CanvasRenderingContext2D; rekt: Rekt }) => {
      const padding = 15;
      ctx.beginPath();
      ctx.arc(rekt.x1 + padding, (rekt.y1 + rekt.y2) / 2, 4, 0, 2 * Math.PI);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = generateFadedColorVariant(theme.accent, '73');
      ctx.stroke();
    },
    [theme.accent]
  );

  const drawText = useCallback(
    ({
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

      const textColor = theme.textPrimary;
      const updatedTextColor =
        animationType === OrderbookRowAnimationType.REMOVE
          ? side === 'bid'
            ? theme.positive
            : theme.negative
          : undefined;

      // Price text
      if (price != null) {
        ctx.fillStyle = textColor;
        ctx.fillText(
          formatNumberOutput(price, OutputType.Number, {
            decimalSeparator,
            groupSeparator,
            selectedLocale,
            fractionDigits: tickSizeDecimals,
          }),
          getXByColumn({ canvasWidth, colIdx: 0 }) - ORDERBOOK_ROW_PADDING_RIGHT,
          y
        );
      }

      const getSizeInFiatString = (sizeToRender: number) =>
        formatNumberOutput(sizeToRender, OutputType.Number, {
          decimalSeparator,
          groupSeparator,
          selectedLocale,
          fractionDigits: 0,
        });

      // Size text
      const displaySize = displayUnit === 'asset' ? size : sizeCost;
      if (displaySize != null) {
        ctx.fillStyle = updatedTextColor ?? textColor;
        ctx.fillText(
          displayUnit === 'asset'
            ? getConsistentAssetSizeString(displaySize, {
                decimalSeparator,
                groupSeparator,
                selectedLocale,
                stepSize,
                stepSizeDecimals,
              })
            : getSizeInFiatString(displaySize),
          getXByColumn({ canvasWidth, colIdx: 1 }) - ORDERBOOK_ROW_PADDING_RIGHT,
          y
        );
      }

      // Depth text
      const displayDepth = displayUnit === 'asset' ? depth : depthCost;
      if (displayDepth != null) {
        ctx.fillStyle = textColor;
        ctx.fillText(
          displayUnit === 'asset'
            ? getConsistentAssetSizeString(displayDepth, {
                decimalSeparator,
                groupSeparator,
                selectedLocale,
                stepSize,
                stepSizeDecimals,
              })
            : getSizeInFiatString(displayDepth),
          getXByColumn({ canvasWidth, colIdx: 2 }) - ORDERBOOK_ROW_PADDING_RIGHT,
          y
        );
      }
    },
    [
      canvasWidth,
      decimalSeparator,
      displayUnit,
      groupSeparator,
      rowHeight,
      selectedLocale,
      side,
      stepSize,
      stepSizeDecimals,
      theme.negative,
      theme.positive,
      theme.textPrimary,
      tickSizeDecimals,
    ]
  );

  const drawOrderbookRow = useCallback(
    ({
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
          ctx,
          value: depth,
          histogramAccentColor,
          histogramSide,
          rekt,
        });
      }

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
    },
    [
      canvasHeight,
      canvasWidth,
      rowHeight,
      drawText,
      side,
      theme.negativeFaded,
      theme.positiveFaded,
      drawBars,
      drawMineCircle,
      histogramSide,
    ]
  );

  // Update histograms and row contents on data change
  useEffect(() => {
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    // Clear canvas before redraw
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Animate row removal (do not animate update)
    const mapOfOrderbookPriceLevels =
      side && currentOrderbookMap?.[side === 'ask' ? 'asks' : 'bids'];

    prevData.current.forEach((row, idx) => {
      if (!row) return;

      const animationType =
        mapOfOrderbookPriceLevels?.[row.price] === 0
          ? OrderbookRowAnimationType.REMOVE
          : OrderbookRowAnimationType.NONE;

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
    canvas,
    drawOrderbookRow,
  ]);

  return { canvasRef };
};
