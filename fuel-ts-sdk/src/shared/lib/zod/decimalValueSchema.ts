import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import {
  DecimalValue,
  type DecimalValueSchema,
  isDecimalValue,
} from '@sdk/shared/models/DecimalValue';
import { z } from 'zod';

export function zodDecimalValueSchema<TDecimals extends number, TBrand extends string>(
  forcedSchema?: DecimalValueSchema<TDecimals, TBrand>
) {
  const fallbackSchema = DecimalValue as DecimalValueSchema<TDecimals, TBrand>;
  const targetSchema = forcedSchema ?? fallbackSchema;

  return z.preprocess((v): DecimalValueInstance<TDecimals, TBrand> => {
    if (typeof v === 'string') return targetSchema.fromBigIntString(v);
    if (typeof v === 'bigint') return targetSchema.fromBigInt(v);
    if (typeof v === 'number') return targetSchema.fromFloat(v);

    if (!isDecimalValue<TDecimals, TBrand>(v, forcedSchema?.decimals))
      throw new Error(`Unexpected value type: ${v}`);

    return v;
  }, z.custom<DecimalValueInstance<TDecimals, TBrand>>());
}
