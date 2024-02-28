import { curveNatural } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { ParentSize } from '@visx/responsive';
import { Axis, LineSeries, XYChart, buildChartTheme, darkTheme } from '@visx/xychart';
import styled from 'styled-components';

interface SparklineChartProps<Datum extends {}> {
  data: Datum[];
  positive: boolean;
  xAccessor: (_: Datum) => number;
  yAccessor: (_: Datum) => number;
}

const theme = buildChartTheme({
  ...darkTheme,
  colors: ['var(--color-positive)', 'var(--color-negative)'],
  tickLength: 0,
  gridColor: 'transparent',
  gridColorDark: 'transparent',
});

export const SparklineChart = <Datum extends {}>(props: SparklineChartProps<Datum>) => {
  const { data, positive, xAccessor, yAccessor } = props;

  return (
    <$ParentSize>
      {({ height, width }: { width: number; height: number }) => (
        <XYChart
          width={width}
          height={height}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          xScale={{
            type: 'linear',
            clamp: false,
            nice: false,
            zero: false,
          }}
          yScale={{
            type: 'linear',
            clamp: true,
            nice: true,
            zero: false,
          }}
          theme={theme}
        >
          <Axis orientation="bottom" hideAxisLine numTicks={0} hideTicks hideZero />
          <Axis orientation="left" hideAxisLine numTicks={0} hideTicks hideZero />
          <LinearGradient
            id="sparkline-gradient-positive"
            from="var(--color-positive)"
            to="var(--color-positive)"
            toOpacity={0.4}
          />
          <LinearGradient
            id="sparkline-gradient-negative"
            from="var(--color-negative)"
            to="var(--color-negative)"
            toOpacity={0.4}
          />
          <LineSeries
            dataKey="Sparkline"
            data={data}
            xAccessor={xAccessor}
            yAccessor={yAccessor}
            curve={curveNatural}
            stroke={
              positive ? 'url(#sparkline-gradient-positive)' : 'url(#sparkline-gradient-negative)'
            }
          />
        </XYChart>
      )}
    </$ParentSize>
  );
};
const $ParentSize = styled(ParentSize)`
  & > svg {
    overflow: visible;
  }
`;
