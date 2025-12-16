import { DecimalValue, DecimalValueCtor, HeadlessDecimalValue } from '../../../models/decimalValue';

export const BigIntMath = {
  abs<T extends DecimalValue>(decimalValue: T): DecimalValue {
    const absValue = decimalValue.value >= 0n ? decimalValue.value : -decimalValue.value;
    return new HeadlessDecimalValue(absValue, decimalValue.decimals);
  },
};

function getConstructor<T extends DecimalValue>(decimalValue: T): DecimalValueCtor<T> {
  return decimalValue.constructor as DecimalValueCtor<T>;
}
