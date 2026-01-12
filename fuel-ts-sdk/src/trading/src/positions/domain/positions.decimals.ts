import { DecimalValue } from '@/shared/models/decimalValue';

export class PositionSize extends DecimalValue {
  declare __brand: typeof PositionSize;
  static decimals = 6n as const;
}

export class PositionFee extends DecimalValue {
  declare __brand: typeof PositionFee;
  static decimals = 9n as const;
}

export class FundingRate extends DecimalValue {
  declare __brand: typeof FundingRate;
  static decimals = 9n as const;
}

export class PnlDelta extends DecimalValue {
  declare __brand: typeof PnlDelta;
  static decimals = 9n as const;
}

export class RealizedPnl extends DecimalValue {
  declare __brand: typeof RealizedPnl;
  static decimals = 9n as const;
}
