import { useCallback, useEffect, useRef, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { CanvasOrderbookLine } from '@/bonsai/types/orderbookTypes';

import { SMALL_USD_DECIMALS, TOKEN_DECIMALS } from '@/constants/numbers';
import {
  ORDERBOOK_ANIMATION_DURATION,
  ORDERBOOK_HEIGHT,
  ORDERBOOK_ROW_HEIGHT,
  ORDERBOOK_ROW_PADDING_RIGHT,
  ORDERBOOK_WIDTH,
} from '@/constants/orderbook';
import { DisplayUnit } from '@/constants/trade';

import { useAppThemeAndColorModeContext } from '@/hooks/useAppThemeAndColorMode';

import { OutputType, formatNumberOutput } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { getConsistentAssetSizeString } from '@/lib/consistentAssetSize';
import { calc } from '@/lib/do';
import { MaybeBigNumber } from '@/lib/numbers';
import {
  getHistogramXValues,
  getRektFromIdx,
  getXByColumn,
  getYForElements,
} from '@/lib/orderbookHelpers';
import { generateFadedColorVariant } from '@/lib/styles';
import { isPresent, orEmptyObj } from '@/lib/typeUtils';

import { useLocaleSeparators } from '../useLocaleSeparators';

type ElementProps = {
  data: Array<CanvasOrderbookLine | undefined>;
  histogramRange: number;
  side: CanvasOrderbookLine['side'];
  displayUnit: DisplayUnit;
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
  const priceSizeMap = data.reduce(
    (acc, row) => {
      if (!row) return acc;
      acc[row.price.toString()] = row.size;
      return acc;
    },
    {} as Record<string, number>
  );
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const marketConfig = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo));
  const stepSizeDecimals = marketConfig.stepSizeDecimals ?? TOKEN_DECIMALS;
  const tickSizeDecimals = marketConfig.tickSizeDecimals ?? SMALL_USD_DECIMALS;
  const stepSize = MaybeBigNumber(marketConfig.stepSize)?.toNumber() ?? 10 ** (-1 * TOKEN_DECIMALS);
  const prevData = useRef<typeof data>(data);
  const theme = useAppThemeAndColorModeContext();

  const rowHeight = ORDERBOOK_ROW_HEIGHT;
  const ratio = window.devicePixelRatio;
  const [canvasWidth, setCanvasWidth] = useState(ORDERBOOK_WIDTH / ratio);
  const [canvasHeight, setCanvasHeight] = useState(ORDERBOOK_HEIGHT / ratio);

  const scaleCanvas = useCallback(
    (width: number, height: number) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const currentRatio = window.devicePixelRatio;
      canvas.width = width * currentRatio;
      canvas.height = height * currentRatio;

      if (ctx) {
        ctx.scale(currentRatio, currentRatio);
        ctx.font = '12px Satoshi';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.imageSmoothingQuality = 'high';
      }

      setCanvasWidth(canvas.width / currentRatio);
      setCanvasHeight(canvas.height / currentRatio);
    },
    [canvas]
  );

  // Handle resize, sync to state
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.contentBoxSize[0]) {
          scaleCanvas(entry.contentBoxSize[0].inlineSize, entry.contentBoxSize[0].blockSize);
        } else {
          scaleCanvas(entry.contentRect.width, entry.contentRect.height);
        }
      });
    });

    if (canvas) {
      resizeObserver.observe(canvas);
    }

    return () => {
      if (canvas) {
        resizeObserver.unobserve(canvas);
      } else {
        resizeObserver.disconnect();
      }
    };
  }, [scaleCanvas, canvas]);

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
            withSubscript: true,
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
      const displaySize = displayUnit === DisplayUnit.Asset ? size : sizeCost;
      if (displaySize != null) {
        ctx.fillStyle = updatedTextColor ?? textColor;
        ctx.fillText(
          displayUnit === DisplayUnit.Asset
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
      const displayDepth = displayUnit === DisplayUnit.Asset ? depth : depthCost;
      if (displayDepth != null) {
        ctx.fillStyle = textColor;
        ctx.fillText(
          displayUnit === DisplayUnit.Asset
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
      rowToRender?: CanvasOrderbookLine;
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
        depth,
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

  const [fontFlag, setFontFlag] = useState(0);
  useEffect(() => {
    const inc = () => setFontFlag((f) => f + 1);
    globalThis.document.fonts.addEventListener('loadingdone', inc);
    return () => globalThis.document.fonts.removeEventListener('loadingdone', inc);
  }, []);

  // Update histograms and row contents on data change
  useEffect(() => {
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return undefined;

    // Clear canvas before redraw
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Animate row removal (do not animate update)

    prevData.current.forEach((row, idx) => {
      if (!row) return;

      const animationType =
        priceSizeMap[row.price] == null
          ? OrderbookRowAnimationType.REMOVE
          : OrderbookRowAnimationType.NONE;

      drawOrderbookRow({ ctx, idx, rowToRender: row, animationType });
    });

    const delayBeforeShowingLatestData = calc(() => {
      // fast track going from empty to non-empty
      if (prevData.current.find(isPresent) == null && data.find(isPresent) != null) {
        return 0;
      }
      return ORDERBOOK_ANIMATION_DURATION;
    });

    const timeout = setTimeout(() => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      data.forEach((row, idx) => drawOrderbookRow({ ctx, idx, rowToRender: row }));
    }, delayBeforeShowingLatestData);

    prevData.current = data;

    return () => {
      clearTimeout(timeout);
    };
  }, [
    fontFlag,
    canvasHeight,
    canvasWidth,
    data,
    histogramRange,
    stepSizeDecimals,
    tickSizeDecimals,
    histogramSide,
    side,
    theme,
    priceSizeMap,
    displayUnit,
    canvas,
    drawOrderbookRow,
  ]);

  return { canvasRef };
};
