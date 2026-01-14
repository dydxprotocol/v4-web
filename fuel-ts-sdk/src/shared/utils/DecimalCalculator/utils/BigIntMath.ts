import type { DecimalValue } from '../../../models/DecimalValue';
import { HeadlessDecimalValue } from '../../../models/DecimalValue';

export const BigIntMath = {
  abs<T extends DecimalValue>(decimalValue: T): DecimalValue {
    const absValue = decimalValue.value >= 0n ? decimalValue.value : -decimalValue.value;
    return new HeadlessDecimalValue(absValue, decimalValue.decimals);
  },
};
