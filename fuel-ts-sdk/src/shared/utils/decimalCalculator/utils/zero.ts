import type { DecimalValue, DecimalValueCtor } from '../../../models/decimalValue';

export function zero<T extends DecimalValue>(Constructor: DecimalValueCtor<T>): T {
  return new Constructor(0n);
}
