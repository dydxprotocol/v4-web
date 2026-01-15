import type { DecimalValueInstance, DecimalValueSchema } from '@/shared/models/DecimalValue';

export function zero<TDecimals extends number, TBrand extends string>(
  schema: DecimalValueSchema<TDecimals, TBrand>
): DecimalValueInstance<TDecimals, TBrand> {
  return schema.fromBigInt(0n);
}
