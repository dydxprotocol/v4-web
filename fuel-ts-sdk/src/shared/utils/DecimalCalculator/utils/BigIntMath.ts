import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';

export const BigIntMath = {
  abs<T extends DecimalValueInstance>(dv: T): T {
    const absValue = dv.value >= 0n ? dv.value : -dv.value;
    return { ...dv, value: absValue };
  },
};
