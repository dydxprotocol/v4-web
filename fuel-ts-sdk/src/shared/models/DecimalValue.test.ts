import { describe, expect, it } from 'vitest';
import { $decimalValue, createDecimalValueSchema } from './DecimalValue';
import { CollateralAmount, OraclePrice, UsdValue } from './decimals';

describe('DecimalValue', () => {
  describe('construction', () => {
    it('should create from bigint', () => {
      const value = UsdValue.fromBigInt(100000000000n); // 100.0 with 9 decimals

      expect(value.value).toBe(100000000000n);
      expect(value.decimals).toBe(9);
    });

    it('should create from float', () => {
      const value = UsdValue.fromFloat(123.456);

      expect($decimalValue(value).toFloat()).toBeCloseTo(123.456, 3);
    });

    it('should create schema with custom decimals', () => {
      const TestDecimal = createDecimalValueSchema(18, 'TestDecimal');

      const value = TestDecimal.fromBigInt(100n);
      expect(value.decimals).toBe(18);
    });
  });

  describe('conversion', () => {
    it('should convert to float', () => {
      const value = UsdValue.fromBigInt(123456789000n); // 123.456789 with 9 decimals

      expect($decimalValue(value).toFloat()).toBeCloseTo(123.456789, 6);
    });

    it('should convert to bigint', () => {
      const value = UsdValue.fromFloat(100.5);

      expect($decimalValue(value).toBigInt()).toBe(100500000000n);
    });

    it('should handle zero', () => {
      const value = UsdValue.fromFloat(0);

      expect($decimalValue(value).toFloat()).toBe(0);
      expect($decimalValue(value).toBigInt()).toBe(0n);
    });

    it('should handle negative values', () => {
      const value = UsdValue.fromFloat(-50.5);

      expect($decimalValue(value).toFloat()).toBeCloseTo(-50.5, 6);
    });
  });

  describe('adjustTo', () => {
    it('should adjust to same decimals', () => {
      const value = UsdValue.fromFloat(100);
      const adjusted = $decimalValue(value).adjustTo(UsdValue);

      expect(adjusted.value).toBe(value.value);
      expect(adjusted.decimals).toBe(UsdValue.decimals);
    });

    it('should adjust to higher decimals', () => {
      // UsdValue has 9 decimals, OraclePrice has 18
      const value = UsdValue.fromFloat(100);
      const adjusted = $decimalValue(value).adjustTo(OraclePrice);

      expect($decimalValue(adjusted).toFloat()).toBeCloseTo(100, 6);
      expect(adjusted.decimals).toBe(OraclePrice.decimals);
    });

    it('should adjust to lower decimals', () => {
      // OraclePrice has 18 decimals, CollateralAmount has 6
      const value = OraclePrice.fromFloat(100);
      const adjusted = $decimalValue(value).adjustTo(CollateralAmount);

      expect($decimalValue(adjusted).toFloat()).toBeCloseTo(100, 6);
      expect(adjusted.decimals).toBe(CollateralAmount.decimals);
    });

    it('should handle precision loss when reducing decimals', () => {
      const value = OraclePrice.fromFloat(100.123456789012345);
      const adjusted = $decimalValue(value).adjustTo(CollateralAmount);

      // CollateralAmount has 6 decimals, we lose precision beyond that
      expect($decimalValue(adjusted).toFloat()).toBeCloseTo(100.123456, 5);
    });
  });

  describe('toDecimalString', () => {
    it('should convert to decimal string', () => {
      const value = UsdValue.fromFloat(123.456);

      expect($decimalValue(value).toDecimalString()).toBe('123.456');
    });

    it('should handle whole numbers', () => {
      const value = UsdValue.fromFloat(100);

      expect($decimalValue(value).toDecimalString()).toBe('100');
    });

    it('should handle small decimals', () => {
      const value = UsdValue.fromFloat(0.001);

      expect($decimalValue(value).toDecimalString()).toBe('0.001');
    });
  });

  describe('fromDecimalString', () => {
    it('should parse decimal string', () => {
      const value = UsdValue.fromDecimalString('123.456');

      expect($decimalValue(value).toFloat()).toBeCloseTo(123.456, 3);
    });

    it('should parse whole number string', () => {
      const value = UsdValue.fromDecimalString('100');

      expect($decimalValue(value).toFloat()).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      const value = UsdValue.fromFloat(1e15);

      expect($decimalValue(value).toFloat()).toBe(1e15);
    });

    it('should handle very small numbers', () => {
      const value = UsdValue.fromFloat(0.000001);

      expect($decimalValue(value).toFloat()).toBeCloseTo(0.000001, 6);
    });

    it('should handle maximum safe integer', () => {
      const maxSafe = UsdValue.fromFloat(Number.MAX_SAFE_INTEGER);

      // Due to floating point precision, we can't expect exact match
      // Just verify it's approximately correct
      const expected = BigInt(Number.MAX_SAFE_INTEGER) * 1000000000n; // 9 decimals
      const diff = maxSafe.value > expected ? maxSafe.value - expected : expected - maxSafe.value;

      // Allow up to 0.1% difference due to floating point precision
      expect(diff).toBeLessThan(expected / 1000n);
    });
  });
});
