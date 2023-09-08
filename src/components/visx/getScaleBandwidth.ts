// https://github.com/airbnb/visx/blob/master/packages/visx-xychart/src/typeguards/isValidNumber.ts

import { AxisScale } from '@visx/axis';

export function getScaleBandwidth<Scale extends AxisScale>(scale?: Scale) {
  // Broaden type before using 'xxx' in s as typeguard.
  const s = scale as AxisScale;
  return s && 'bandwidth' in s ? s?.bandwidth() ?? 0 : 0;
}
