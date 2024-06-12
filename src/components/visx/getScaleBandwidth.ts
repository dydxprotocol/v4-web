// https://github.com/airbnb/visx/blob/master/packages/visx-xychart/src/typeguards/isValidNumber.ts
import { AxisScale } from '@visx/axis';

export function getScaleBandwidth<Scale extends AxisScale>(s?: Scale) {
  return s && 'bandwidth' in s ? s?.bandwidth() ?? 0 : 0;
}
