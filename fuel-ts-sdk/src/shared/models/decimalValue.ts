export type DecimalValueCtor<T extends DecimalValue = DecimalValue> = {
  new (value: bigint): T;
  decimals: bigint;
};

export abstract class DecimalValue {
  static decimals: bigint;
  protected decimalsOverride?: bigint;

  get decimals() {
    return this.decimalsOverride ?? (this.constructor as typeof DecimalValue).decimals;
  }

  constructor(public readonly value: bigint) {
    if (this instanceof HeadlessDecimalValue) return;
    if (this.decimals === undefined)
      throw new Error(`${this.constructor.name} must define static decimals property`);
  }

  static fromBigInt<T extends DecimalValue>(this: DecimalValueCtor<T>, value: bigint): T {
    return new this(value);
  }

  static fromFloat<T extends DecimalValue>(this: DecimalValueCtor<T>, floatValue: number): T {
    const multiplier = 10n ** this.decimals;
    const value = BigInt(Math.round(floatValue * Number(multiplier)));
    return new this(value);
  }

  adjustTo<T extends DecimalValue>(DecimalValueConstructor: DecimalValueCtor<T>): T {
    const targetDecimals = DecimalValueConstructor.decimals;
    const adjustment = this.decimals - targetDecimals;

    if (adjustment === 0n) {
      return new DecimalValueConstructor(this.value);
    }

    let newValue: bigint;
    if (adjustment > 0n) {
      newValue = this.value / 10n ** adjustment;
    } else {
      newValue = this.value * 10n ** -adjustment;
    }

    return new DecimalValueConstructor(newValue);
  }

  toFloat(): number {
    return Number(this.value) / Number(10n ** this.decimals);
  }

  toBigInt(): bigint {
    return this.value;
  }
}

export class HeadlessDecimalValue extends DecimalValue {
  declare __brand: typeof HeadlessDecimalValue;

  constructor(value: bigint, decimals: bigint) {
    super(value);
    this.decimalsOverride = decimals;
  }
}
