import { z } from 'zod';

import type { DecimalValue } from '../../../models/decimalValue';

export function decimalValueSchema<T extends DecimalValue>(
  DecimalValueCtor: new (value: bigint) => T
) {
  return z.bigint().transform((val) => new DecimalValueCtor(val));
}
