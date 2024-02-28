import React, { PropsWithChildren, useContext, useState } from 'react';

import { localPoint } from '@visx/event';
import { Point } from '@visx/point';
import { DataContext, XYChart, type EventHandlerParams } from '@visx/xychart';

import { getScaleBandwidth } from '@/components/visx/getScaleBandwidth';

export const XYChartWithPointerEvents = ({
  onPointerMove,
  onPointerUp,
  onPointerPressedChange,
  ...props
}: {
  onPointerMove?: (point: Point | EventHandlerParams<object>) => void;
  onPointerUp?: (point: Point | EventHandlerParams<object>) => void;
  onPointerPressedChange?: (isPointerPressed: boolean) => void;
} & PropsWithChildren<Parameters<typeof XYChart>[0]>) => {
  const { xScale, yScale } = useContext(DataContext);
  const [lastPointerMoveEvent, setLastPointerMoveEvent] = useState<React.PointerEvent>();

  const pointerContainerPosition = lastPointerMoveEvent ? localPoint(lastPointerMoveEvent) : null;

  const pointerChartPosition =
    xScale &&
    yScale &&
    pointerContainerPosition &&
    new Point({
      // @ts-expect-error invert supposedly doesn't exist on AxisScale
      x: xScale.invert(pointerContainerPosition?.x - getScaleBandwidth(xScale) / 2),
      // @ts-expect-error invert supposedly doesn't exist on AxisScale
      y: yScale.invert(pointerContainerPosition?.y - getScaleBandwidth(yScale) / 2),
    });

  return (
    <XYChart
      {...props}
      onPointerMove={({ event }) => {
        setLastPointerMoveEvent(event as React.PointerEvent);
        if (pointerChartPosition) onPointerMove?.(pointerChartPosition);
      }}
      onPointerOut={() => setLastPointerMoveEvent(undefined)}
      onPointerDown={() => onPointerPressedChange?.(true)}
      onPointerUp={() => {
        onPointerPressedChange?.(false);
        if (pointerChartPosition) onPointerUp?.(pointerChartPosition);
      }}
    >
      {props.children}
    </XYChart>
  );
};
