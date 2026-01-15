import { z } from 'zod';
import type { DecimalValueInstance, DecimalValueSchema } from '@sdk/shared/models/DecimalValue';

export function decimalValueSchema<TDecimals extends number, TBrand extends string>(
  schema: DecimalValueSchema<TDecimals, TBrand>
) {
  return z
    .bigint()
    .transform((val): DecimalValueInstance<TDecimals, TBrand> => schema.fromBigInt(val));
}
