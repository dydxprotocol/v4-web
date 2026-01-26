import {
  DecimalValue,
  type DecimalValueInstance,
  type DecimalValueSchema,
} from '@sdk/shared/models/DecimalValue';

export function zero<TDecimals extends number, TBrand extends string>(
  schema: DecimalValueSchema<TDecimals, TBrand> = DecimalValue as DecimalValueSchema<
    TDecimals,
    TBrand
  >
): DecimalValueInstance<TDecimals, TBrand> {
  return schema.fromBigInt(0n);
}

export function one<TDecimals extends number, TBrand extends string>(
  schema: DecimalValueSchema<TDecimals, TBrand> = DecimalValue as DecimalValueSchema<
    TDecimals,
    TBrand
  >
): DecimalValueInstance<TDecimals, TBrand> {
  return schema.fromBigInt(1n);
}
