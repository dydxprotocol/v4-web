export interface DecimalValueInstance<
  TDecimals extends number = number,
  TBrand extends string = string,
> {
  value: string;
  decimals: TDecimals;
  readonly __brand?: TBrand;
}

export const DecimalValue = createDecimalValueSchema(6);

export interface DecimalValueSchema<TDecimals extends number, TBrand extends string = string> {
  decimals: TDecimals;
  __brand: TBrand;

  fromFloat(floatValue: number): DecimalValueInstance<TDecimals, TBrand>;
  fromBigInt(value: bigint): DecimalValueInstance<TDecimals, TBrand>;
  fromBigIntString(value: string): DecimalValueInstance<TDecimals, TBrand>;
  fromDecimalString(str: string): DecimalValueInstance<TDecimals, TBrand>;
}

export type InferDecimalValueType<TSchema> =
  TSchema extends DecimalValueSchema<infer TDecimals, infer TBrand>
    ? DecimalValueInstance<TDecimals, TBrand>
    : never;

export function createDecimalValueSchema<
  TDecimals extends number,
  TBrand extends string = 'unbranded',
>(
  decimals: TDecimals,
  brand: TBrand = 'unbranded' as TBrand
): DecimalValueSchema<TDecimals, TBrand> {
  function createInstance(value: bigint | string): DecimalValueInstance<TDecimals, TBrand> {
    return {
      value: String(value),
      decimals,
    };
  }

  return {
    decimals,
    __brand: brand,

    fromBigIntString(value: string): DecimalValueInstance<TDecimals, TBrand> {
      return createInstance(value);
    },

    fromBigInt(value: bigint): DecimalValueInstance<TDecimals, TBrand> {
      return createInstance(value);
    },

    fromFloat(floatValue: number): DecimalValueInstance<TDecimals, TBrand> {
      const multiplier = 10n ** BigInt(this.decimals);
      const value = BigInt(Math.round(floatValue * Number(multiplier)));
      return createInstance(value);
    },

    fromDecimalString(str: string): DecimalValueInstance<TDecimals, TBrand> {
      const [integerPart = '0', decimalPart = ''] = str.split('.');
      const paddedDecimal = decimalPart.padEnd(Number(this.decimals), '0');
      const value = BigInt(integerPart + paddedDecimal);
      return createInstance(value);
    },
  };
}

export function $decimalValue<T extends DecimalValueInstance<number, string>>(dv: T) {
  return {
    adjustTo<TDecimals extends number, TBrand extends string>(
      schema: DecimalValueSchema<TDecimals, TBrand>
    ): DecimalValueInstance<TDecimals, TBrand> {
      const targetDecimals = schema.decimals;
      const adjustment = BigInt(dv.decimals - targetDecimals);

      if (adjustment === 0n) {
        return schema.fromBigInt(BigInt(dv.value));
      }

      let newValue: bigint;
      if (adjustment > 0n) {
        newValue = BigInt(dv.value) / 10n ** adjustment;
      } else {
        newValue = BigInt(dv.value) * 10n ** -adjustment;
      }

      return schema.fromBigInt(newValue);
    },

    toDecimalString(): string {
      const str = dv.value.toString().padStart(Number(dv.decimals) + 1, '0');
      const dotIndex = str.length - Number(dv.decimals);
      if (dotIndex === str.length) return str;
      return (str.slice(0, dotIndex) + '.' + str.slice(dotIndex)).replace(/\.?0+$/, '');
    },

    toFloat(): number {
      return Number(dv.value) / Number(10n ** BigInt(dv.decimals));
    },

    toBigInt(): bigint {
      return BigInt(dv.value);
    },
  };
}
