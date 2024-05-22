// Forked from original XYChart Tooltip to use TooltipWithBounds instead of TooltipInPortal:
// https://github.com/airbnb/visx/blob/master/packages/visx-xychart/src/components/Tooltip.tsx
import React, { useCallback, useContext, useEffect } from 'react';

import { Group } from '@visx/group';
import { PickD3Scale } from '@visx/scale';
import { TooltipWithBounds } from '@visx/tooltip';
import type { TooltipProps as BaseTooltipProps } from '@visx/tooltip/lib/tooltips/Tooltip';
import {
  DataContext,
  TooltipContext,
  type GlyphProps as RenderGlyphProps,
  type TooltipContextType,
} from '@visx/xychart';

import { getScaleBandwidth } from './getScaleBandwidth';
import { isValidNumber } from './isValidNumber';

export type RenderTooltipParams<Datum extends object> = TooltipContextType<Datum> & {
  colorScale?: PickD3Scale<'ordinal', string, string>;
};

export interface RenderTooltipGlyphProps<Datum extends object> extends RenderGlyphProps<Datum> {
  glyphStyle?: React.SVGProps<SVGCircleElement>;
  isNearestDatum: boolean;
}

export type TooltipProps<Datum extends object> = {
  /**
   * When TooltipContext.tooltipOpen=true, this function is invoked and if the
   * return value is non-null, its content is rendered inside the tooltip container.
   * Content will be rendered in an HTML parent.
   */
  renderTooltip: (params: RenderTooltipParams<Datum>) => React.ReactNode;
  /** Function which handles rendering glyphs. */
  renderGlyph?: (params: RenderTooltipGlyphProps<Datum>) => React.ReactNode;

  renderYAxisLabel?: (params: RenderTooltipParams<Datum>) => React.ReactNode;
  renderXAxisLabel?: (params: RenderTooltipParams<Datum>) => React.ReactNode;

  /** Whether to snap tooltip x-coord to the nearest Datum x-coord instead of the event x-coord. */
  snapTooltipToDatumX?: boolean;
  /** Whether to snap tooltip y-coord to the nearest Datum y-coord instead of the event y-coord. */
  snapTooltipToDatumY?: boolean;
  /** Whether to show a vertical line at tooltip position. */
  showVerticalCrosshair?: boolean;
  /** Whether to show a horizontal line at tooltip position. */
  showHorizontalCrosshair?: boolean;
  /** Whether to snap crosshair x-coord to the nearest Datum x-coord instead of the event x-coord. */
  snapCrosshairToDatumX?: boolean;
  /** Whether to snap crosshair y-coord to the nearest Datum y-coord instead of the event y-coord. */
  snapCrosshairToDatumY?: boolean;
  /** Whether to show a glyph at the tooltip position for the (single) nearest Datum. */
  showDatumGlyph?: boolean;
  /** Whether to show a glyph for the nearest Datum in each series. */
  showSeriesGlyphs?: boolean;
  /** Optional styles for the vertical crosshair, if visible. */
  verticalCrosshairStyle?: React.SVGProps<SVGLineElement>;
  /** Optional styles for the vertical crosshair, if visible. */
  horizontalCrosshairStyle?: React.SVGProps<SVGLineElement>;
  /** Optional styles for the point, if visible. */
  glyphStyle?: React.SVGProps<SVGCircleElement>;
} & Omit<BaseTooltipProps, 'left' | 'top' | 'children'> & {
    onTooltipContext?: (tooltipContext: TooltipContextType<Datum>) => void;
  };

const DefaultGlyph = <Datum extends object>({
  x,
  y,
  size,
  color,
  glyphStyle,
}: RenderTooltipGlyphProps<Datum>) => {
  const { theme } = useContext(DataContext) || {};

  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      stroke={theme?.backgroundColor}
      strokeWidth={1.5}
      paintOrder="fill"
      {...glyphStyle}
    />
  );
};

function defaultRenderGlyph<Datum extends object>(props: RenderTooltipGlyphProps<Datum>) {
  return <DefaultGlyph {...props} />;
}

const TooltipInner = <Datum extends object>({
  horizontalCrosshairStyle,
  glyphStyle,
  onTooltipContext,
  renderTooltip,
  renderYAxisLabel,
  renderXAxisLabel,
  renderGlyph = defaultRenderGlyph,
  showDatumGlyph = false,
  showHorizontalCrosshair = false,
  showSeriesGlyphs = false,
  showVerticalCrosshair = false,
  snapTooltipToDatumX = false,
  snapTooltipToDatumY = false,
  snapCrosshairToDatumX = true,
  snapCrosshairToDatumY = true,
  verticalCrosshairStyle,
  ...tooltipProps
}: TooltipProps<Datum>) => {
  const {
    colorScale,
    theme,
    innerHeight = 0,
    innerWidth = 0,
    margin = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xScale,
    yScale,
    dataRegistry,
  } = useContext(DataContext) || {};

  const tooltipContext = useContext(TooltipContext) as TooltipContextType<Datum>;

  useEffect(() => {
    onTooltipContext?.(tooltipContext);
  }, [tooltipContext]);

  const tooltipContent = tooltipContext?.tooltipOpen
    ? renderTooltip({ ...tooltipContext, colorScale })
    : null;

  const showTooltip = tooltipContext?.tooltipOpen && tooltipContent != null;

  let computedTooltipLeft = tooltipContext?.tooltipLeft ?? 0;
  let computedTooltipTop = tooltipContext?.tooltipTop ?? 0;
  let crosshairLeft = computedTooltipLeft;
  let crosshairTop = computedTooltipTop;

  const xScaleBandwidth = xScale ? getScaleBandwidth(xScale) : 0;
  const yScaleBandwidth = yScale ? getScaleBandwidth(yScale) : 0;

  const getDatumLeftTop = useCallback(
    (key: string, datum: Datum) => {
      const entry = dataRegistry?.get(key);
      const xAccessor = entry?.xAccessor;
      const yAccessor = entry?.yAccessor;
      const left =
        xScale && xAccessor
          ? Number(xScale(xAccessor(datum))) + xScaleBandwidth / 2 ?? 0
          : undefined;
      const top =
        yScale && yAccessor
          ? Number(yScale(yAccessor(datum))) + yScaleBandwidth / 2 ?? 0
          : undefined;
      return { left, top };
    },
    [dataRegistry, xScaleBandwidth, yScaleBandwidth, xScale, yScale]
  );

  const nearestDatum = tooltipContext?.tooltipData?.nearestDatum;
  const nearestDatumKey = nearestDatum?.key ?? '';

  if (showTooltip && nearestDatum) {
    const { left, top } = getDatumLeftTop(nearestDatumKey, nearestDatum.datum);

    // snap x- or y-coord to the actual data point (not event coordinates)
    computedTooltipLeft = snapTooltipToDatumX && isValidNumber(left) ? left : computedTooltipLeft;
    computedTooltipTop = snapTooltipToDatumY && isValidNumber(top) ? top : computedTooltipTop;

    crosshairLeft = snapCrosshairToDatumX && isValidNumber(left) ? left : crosshairLeft;
    crosshairTop = snapCrosshairToDatumY && isValidNumber(top) ? top : crosshairTop;
  }

  // collect positions + styles for glyphs; glyphs always snap to Datum, not event coords
  const glyphProps: RenderTooltipGlyphProps<Datum>[] = [];

  if (showTooltip && (showDatumGlyph || showSeriesGlyphs)) {
    const size = Number(glyphStyle?.radius ?? 4);

    if (showSeriesGlyphs) {
      Object.values(tooltipContext?.tooltipData?.datumByKey ?? {}).forEach(
        ({ key, datum, index }) => {
          const color = colorScale?.(key) ?? theme?.htmlLabel?.color ?? '#222';
          const { left, top } = getDatumLeftTop(key, datum);

          // don't show glyphs if coords are unavailable
          if (!isValidNumber(left) || !isValidNumber(top)) return;

          glyphProps.push({
            key,
            color,
            datum,
            index,
            size,
            x: left,
            y: top,
            glyphStyle,
            isNearestDatum: nearestDatum ? nearestDatum.key === key : false,
          });
        }
      );
    } else if (nearestDatum) {
      const { left, top } = getDatumLeftTop(nearestDatumKey, nearestDatum.datum);
      // don't show glyphs if coords are unavailable
      if (isValidNumber(left) && isValidNumber(top)) {
        const color =
          (nearestDatumKey && colorScale?.(nearestDatumKey)) ??
          null ??
          theme?.gridStyles?.stroke ??
          theme?.htmlLabel?.color ??
          '#222';
        glyphProps.push({
          key: nearestDatumKey,
          color,
          datum: nearestDatum.datum,
          index: nearestDatum.index,
          size,
          x: left,
          y: top,
          glyphStyle,
          isNearestDatum: true,
        });
      }
    }
  }

  const yAxisLabelSide =
    crosshairLeft < innerWidth / 2
      ? crosshairLeft < 120
        ? 'right'
        : 'left'
      : crosshairLeft > innerWidth - 120
      ? 'left'
      : 'right';

  return showTooltip ? (
    <g data-state={showTooltip ? 'open' : 'closed'}>
      {showVerticalCrosshair && (
        <line
          x1={crosshairLeft}
          x2={crosshairLeft}
          y1={margin.top}
          y2={margin.top + innerHeight}
          strokeWidth={1.5}
          stroke={theme?.gridStyles?.stroke ?? theme?.htmlLabel?.color ?? '#222'}
          {...verticalCrosshairStyle}
        />
      )}

      {showHorizontalCrosshair && (
        <line
          x1={margin.left}
          x2={margin.left + innerWidth}
          y1={crosshairTop}
          y2={crosshairTop}
          strokeWidth={1.5}
          stroke={theme?.gridStyles?.stroke ?? theme?.htmlLabel?.color ?? '#222'}
          {...horizontalCrosshairStyle}
        />
      )}

      {nearestDatum && renderXAxisLabel && (
        <Group left={crosshairLeft} top={margin.top + innerHeight + margin.bottom / 2}>
          <foreignObject style={{ overflow: 'visible' }}>
            {renderXAxisLabel?.({ ...tooltipContext, colorScale })}
          </foreignObject>
        </Group>
      )}

      {nearestDatum && renderYAxisLabel && (
        <Group
          data-side={yAxisLabelSide}
          left={yAxisLabelSide === 'left' ? margin.left : margin.left + innerWidth - margin.right}
          top={crosshairTop}
        >
          <foreignObject style={{ overflow: 'visible' }}>
            {renderYAxisLabel?.({ ...tooltipContext, colorScale })}
          </foreignObject>
        </Group>
      )}

      {glyphProps.map(({ x, y, ...props }) => renderGlyph({ x, y, ...props }))}

      <foreignObject style={{ width: '100%', height: `calc(100% - ${margin.bottom}px)` }}>
        <TooltipWithBounds left={computedTooltipLeft} top={computedTooltipTop} {...tooltipProps}>
          {tooltipContent}
        </TooltipWithBounds>
      </foreignObject>
    </g>
  ) : null;
};

const Tooltip = <Datum extends object>(props: TooltipProps<Datum>) => {
  return <TooltipInner {...props} />;
};

/**
 * This is a wrapper component which bails early if tooltip is not visible.
 * If many charts with Tooltips are rendered on a page,
 * this avoids creating many resize observers / hitting browser limits.
 */
export default Tooltip;
