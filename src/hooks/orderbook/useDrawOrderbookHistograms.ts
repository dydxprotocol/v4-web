import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import type { Nullable } from '@/constants/abacus';
import { SMALL_USD_DECIMALS, TOKEN_DECIMALS } from '@/constants/numbers';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';

import { getAppTheme } from '@/state/configsSelectors';

import { ROW_HEIGHT, ROW_PADDING_RIGHT, type RowData } from '@/views/Orderbook/OrderbookRow';

import { MustBigNumber } from '@/lib/numbers';

export const useDrawOrderbookHistograms = ({
  data,
  histogramRange,
  stepSizeDecimals,
  tickSizeDecimals,
  to = 'left',
  hoveredRow,
}: {
  data: RowData[];
  histogramRange: number;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
  to?: 'left' | 'right';
  hoveredRow?: number;
}) => {
  const selectedTheme = useSelector(getAppTheme);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef.current;
  const hoverCanvas = hoverCanvasRef.current;

  /**
   *         to === 'right'                to === 'left'
   *         |===================|         |===================|
   * bar:    a                   b         c                   d
   * a = 0
   * b = depthBarWidth
   * c = canvasWidth - depthBarWidth
   * d = canvasWidth
   *
   */
  const getXYValues = ({
    barWidth,
    canvasWidth,
    gradientMultiplier,
  }: {
    barWidth: number;
    canvasWidth: number;
    gradientMultiplier: number;
  }) => {
    const gradient = {
      x1: Math.floor(to === 'right' ? barWidth : canvasWidth - barWidth),
      x2: Math.floor(
        to === 'right'
          ? 0 - (canvasWidth * gradientMultiplier - canvasWidth)
          : canvasWidth * gradientMultiplier
      ),
    };
    const bar = {
      x1: Math.floor(to === 'right' ? 0 : canvasWidth - barWidth),
      x2: Math.floor(to === 'right' ? Math.min(barWidth, canvasWidth - 2) : canvasWidth - 2),
    };

    return {
      bar,
      gradient,
    };
  };

  const getYFromIndex = (idx: number, type: 'text' | 'bar' | 'rect') => {
    return (
      idx * ROW_HEIGHT +
      {
        text: ROW_HEIGHT / 2, // center of the row
        bar: 1, // 1px off the top and bottom so the histograms do not touch
        rect: 0,
      }[type]
    );
  };

  // Get X value by column, colIdx starts at 0
  const getXByColumn = ({ canvasWidth, colIdx }: { canvasWidth: number; colIdx: number }) => {
    return Math.floor(((colIdx + 1) * canvasWidth) / 3);
  };

  const drawBars = ({
    value,
    canvasWidth,
    ctx,
    gradientMultiplier,
    histogramAccentColor,
    idx,
    to,
  }: {
    value: Nullable<number>;
    canvasWidth: number;
    ctx: CanvasRenderingContext2D;
    gradientMultiplier: number;
    histogramAccentColor: string;
    idx: number;
    to: 'left' | 'right';
  }) => {
    const histogramBarWidth = canvasWidth - 2;
    const barWidth = value ? (value / histogramRange) * histogramBarWidth : 0;
    const { gradient, bar } = getXYValues({ barWidth, canvasWidth, gradientMultiplier });

    const linearGradient = ctx.createLinearGradient(
      gradient.x1,
      ROW_HEIGHT / 2,
      gradient.x2,
      ROW_HEIGHT / 2
    );
    linearGradient.addColorStop(0, histogramAccentColor);
    linearGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = linearGradient;

    ctx.beginPath();

    ctx.roundRect
      ? ctx.roundRect?.(
          bar.x1,
          getYFromIndex(idx, 'bar'),
          bar.x2,
          ROW_HEIGHT - 2,
          to === 'left' ? [2, 0, 0, 2] : [0, 2, 2, 0]
        )
      : ctx.rect(bar.x1, getYFromIndex(idx, 'bar'), bar.x2, ROW_HEIGHT - 2);
    ctx.fill();
  };

  const { decimal: LOCALE_DECIMAL_SEPARATOR } = useLocaleSeparators();

  const formatOptions = {
    decimalSeparator: LOCALE_DECIMAL_SEPARATOR,
  };

  const drawText = useCallback(
    ({
      ctx,
      canvasWidth,
      idx,
      size,
      price,
      mine,
    }: {
      ctx: CanvasRenderingContext2D;
      canvasWidth: number;
      idx: number;
      size?: Nullable<number>;
      price?: Nullable<number>;
      mine?: Nullable<number>;
    }) => {
      const y = getYFromIndex(idx, 'text');

      // Size text
      if (size) {
        ctx.fillStyle = 'white';
        ctx.fillText(
          MustBigNumber(size).toFormat(stepSizeDecimals ?? TOKEN_DECIMALS, formatOptions),
          getXByColumn({ canvasWidth, colIdx: 0 }) - ROW_PADDING_RIGHT,
          y
        );
      }

      // Price text
      if (price) {
        ctx.fillStyle = 'white';
        ctx.fillText(
          MustBigNumber(price).toFormat(tickSizeDecimals ?? SMALL_USD_DECIMALS, formatOptions),
          getXByColumn({ canvasWidth, colIdx: 1 }) - ROW_PADDING_RIGHT,
          y
        );
      }

      // Mine text
      if (mine) {
        ctx.fillStyle = 'white';
        ctx.fillText(
          MustBigNumber(mine).toFormat(stepSizeDecimals ?? TOKEN_DECIMALS, formatOptions),
          getXByColumn({ canvasWidth, colIdx: 2 }) - ROW_PADDING_RIGHT,
          y
        );
      }
    },
    [LOCALE_DECIMAL_SEPARATOR]
  );

  /**
   * Scale canvas using device pixel ratio to unblur drawn text
   * @returns adjusted canvas width used in coordinates for drawing
   **/
  const canvasWidth = useMemo(() => {
    const devicePixelRatio = window.devicePixelRatio || 1;

    if (!canvas || !hoverCanvas) return 300 / devicePixelRatio;

    const ctx = canvas.getContext('2d');
    const hoverCtx = hoverCanvas.getContext('2d');

    const backingStoreRatio =
      // @ts-ignore
      ctx.webkitBackingStorePixelRatio ||
      // @ts-ignore
      ctx.mozBackingStorePixelRatio ||
      // @ts-ignore
      ctx.msBackingStorePixelRatio ||
      // @ts-ignore
      ctx.oBackingStorePixelRatio ||
      // @ts-ignore
      ctx.backingStorePixelRatio ||
      1;

    const ratio = devicePixelRatio / backingStoreRatio;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    hoverCanvas.width = hoverCanvas.offsetWidth * ratio;
    hoverCanvas.height = hoverCanvas.offsetHeight * ratio;

    if (hoverCtx) {
      hoverCtx.scale(ratio, ratio);
    }

    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.font = `12.5px Satoshi`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.imageSmoothingQuality = 'high';
    }

    return canvas.width / ratio;
  }, [canvas, hoverCanvas]);

  /**
   * Handle Row Hover
   */
  const lastHoveredRowRef = useRef<number>();
  const lastHoveredRow = lastHoveredRowRef.current;
  useEffect(() => {
    const hoverCtx = hoverCanvas?.getContext('2d');

    if (!!!hoverCtx) return;

    if (hoveredRow !== lastHoveredRow) {
      const y = getYFromIndex(lastHoveredRow ?? 0, 'rect');
      hoverCtx.clearRect(0, y, canvasWidth, ROW_HEIGHT);
      lastHoveredRowRef.current = hoveredRow;
    }

    if (hoveredRow !== undefined) {
      hoverCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      hoverCtx.fillRect(0, hoveredRow * 20, canvasWidth, 20);
    }
  }, [lastHoveredRow, hoveredRow]);

  // Update histograms and row contents on data change
  useEffect(() => {
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    // Clear canvas before redraw
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw histograms
    data.forEach(({ depth, mine, price, size, side }, idx) => {
      const histogramAccentColor =
        side === 'bid' ? `hsla(159, 67%, 39%,  0.15)` : `hsla(360, 73%, 61%,  0.15)`;

      // Depth Bar
      drawBars({
        value: depth,
        canvasWidth,
        ctx,
        gradientMultiplier: 1.3,
        histogramAccentColor,
        idx,
        to,
      });

      // Size Bar
      drawBars({
        value: size,
        canvasWidth,
        ctx,
        gradientMultiplier: 5,
        histogramAccentColor,
        idx,
        to,
      });

      // Size, Price, Mine
      drawText({
        ctx,
        canvasWidth,
        idx,
        size,
        price,
        mine,
      });
    });
  }, [
    canvasWidth,
    data,
    drawText,
    histogramRange,
    selectedTheme,
    stepSizeDecimals,
    tickSizeDecimals,
    to,
  ]);

  return { canvasRef, hoverCanvasRef };
};
