import { DecimalValue } from './decimalValue';

export class OraclePrice extends DecimalValue {
  declare __brand: typeof OraclePrice;
  static decimals = 18n as const;
}
export class UsdValue extends DecimalValue {
  declare __brand: typeof UsdValue;
  static decimals = 9n as const;
}
export class PercentageMultiplier extends DecimalValue {
  declare __brand: typeof PercentageMultiplier;
  static decimals = 0n as const;
}
export class PercentageValue extends DecimalValue {
  declare __brand: typeof PercentageValue;
  static decimals = 18n as const;
}
export class RatioOutput extends DecimalValue {
  declare __brand: typeof RatioOutput;
  static decimals = 18n as const;
}
export class CollateralAmount extends DecimalValue {
  declare __brand: typeof CollateralAmount;
  static decimals = 9n as const;
}
