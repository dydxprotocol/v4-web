import React, { useContext, useState } from 'react';

import { Point } from '@visx/point';
import { localPoint } from '@visx/event';
import { XYChart, DataContext } from '@visx/xychart';
import { getScaleBandwidth } from '@/components/visx/getScaleBandwidth';

export const XYChartWithPointerEvents = ({
  onPointerMove, onPointerUp, onPointerPressedChange, ...props
}: {
  onPointerMove?: (point: Point) => void;
  onPointerUp?: (point: Point) => void;
  onPointerPressedChange?: (isPointerPressed: boolean) => void;
} & React.PropsWithChildren<Parameters<typeof XYChart>>) => {
  const { xScale, yScale } = useContext(DataContext);

  const [lastPointerMoveEvent, setLastPointerMoveEvent] = useState<React.PointerEvent>();

  const pointerContainerPosition = lastPointerMoveEvent ? localPoint(lastPointerMoveEvent) : null;

  const pointerChartPosition = xScale && yScale && pointerContainerPosition &&
    new Point({
      x: xScale.invert(pointerContainerPosition?.x - getScaleBandwidth(xScale) / 2),
      y: yScale.invert(pointerContainerPosition?.y - getScaleBandwidth(yScale) / 2),
    });

  return (
    <XYChart
      {...props}
      onPointerMove={({ event }) => {
        setLastPointerMoveEvent(event as React.PointerEvent);
        if (pointerChartPosition)
          onPointerMove?.(pointerChartPosition);
      }}
      onPointerOut={() => setLastPointerMoveEvent(undefined)}
      onPointerDown={() => onPointerPressedChange?.(true)}
      onPointerUp={() => {
        onPointerPressedChange?.(false);
        if (pointerChartPosition)
          onPointerUp?.(pointerChartPosition);
      }}
    >
      {props.children}
    </XYChart>
  );
};
