import { Threshold } from '@visx/threshold';
import { DataContext } from '@visx/xychart';
import { useContext } from 'react';

/** A visx <Threshold> that scales based on the nearest <DataProvider>. Use inside <XYChart>. */
export const XYChartThreshold = <Datum extends {}>({
  x,
  y0,
  y1,
  ...props
}: Parameters<typeof Threshold<Datum>>[0]) => {
  const { xScale, yScale } = useContext(DataContext);

  return xScale && yScale ? (
    <>
      <Threshold<Datum>
        x={(datum, index, data) => xScale(typeof x === 'function' ? x(datum, index, data) : x) as number}
        y0={(datum, index, data) => yScale(typeof y0 === 'function' ? y0(datum, index, data) : y0) as number}
        y1={(datum, index, data) => yScale(typeof y1 === 'function' ? y1(datum, index, data) : y1) as number}
        {...props}
      />
    </>
  ) : null;
};

export { Threshold };
