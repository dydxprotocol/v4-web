import type { DecimalValue } from '../../../models/decimalValue';
import { HeadlessDecimalValue } from '../../../models/decimalValue';

export const BigIntMath = {
  abs<T extends DecimalValue>(decimalValue: T): DecimalValue {
    const absValue = decimalValue.value >= 0n ? decimalValue.value : -decimalValue.value;
    return new HeadlessDecimalValue(absValue, decimalValue.decimals);
  },
};
