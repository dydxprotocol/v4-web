import type { DecimalValueInstance, DecimalValueSchema } from '@sdk/shared/models/DecimalValue';
import { z } from 'zod';

export function decimalValueSchema<TDecimals extends number, TBrand extends string>(
  schema: DecimalValueSchema<TDecimals, TBrand>
) {
  return z
    .string()
    .transform((val): DecimalValueInstance<TDecimals, TBrand> => schema.fromBigIntString(val));
}
