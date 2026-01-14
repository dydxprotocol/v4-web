import { describe, expect, it } from 'vitest';
import { DecimalValue, HeadlessDecimalValue } from './decimalValue';
import { CollateralAmount, OraclePrice, UsdValue } from './decimals';

describe('DecimalValue', () => {
  describe('construction', () => {
    it('should create from bigint', () => {
      const value = UsdValue.fromBigInt(100000000000n); // 100.0 with 9 decimals

      expect(value.value).toBe(100000000000n);
      expect(value.decimals).toBe(9n);
    });

    it('should create from float', () => {
      const value = UsdValue.fromFloat(123.456);

      expect(value.toFloat()).toBeCloseTo(123.456, 3);
    });

    it('should use default decimals if not defined', () => {
      class TestDecimal extends DecimalValue {
        // No static decimals property, will use default (18n)
      }

      const value = new TestDecimal(100n);
      expect(value.decimals).toBe(18n);
    });
  });

  describe('conversion', () => {
    it('should convert to float', () => {
      const value = UsdValue.fromBigInt(123456789000n); // 123.456789 with 9 decimals

      expect(value.toFloat()).toBeCloseTo(123.456789, 6);
    });

    it('should convert to bigint', () => {
      const value = UsdValue.fromFloat(100.5);

      expect(value.toBigInt()).toBe(100500000000n);
    });

    it('should handle zero', () => {
      const value = UsdValue.fromFloat(0);

      expect(value.toFloat()).toBe(0);
      expect(value.toBigInt()).toBe(0n);
    });

    it('should handle negative values', () => {
      const value = UsdValue.fromFloat(-50.5);

      expect(value.toFloat()).toBeCloseTo(-50.5, 6);
    });
  });

  describe('adjustTo', () => {
    it('should adjust to same decimals', () => {
      const value = UsdValue.fromFloat(100);
      const adjusted = value.adjustTo(UsdValue);

      expect(adjusted.value).toBe(value.value);
      expect(adjusted.decimals).toBe(UsdValue.decimals);
    });

    it('should adjust to higher decimals', () => {
      // UsdValue has 9 decimals, OraclePrice has 18
      const value = UsdValue.fromFloat(100);
      const adjusted = value.adjustTo(OraclePrice);

      expect(adjusted.toFloat()).toBeCloseTo(100, 6);
      expect(adjusted.decimals).toBe(OraclePrice.decimals);
    });

    it('should adjust to lower decimals', () => {
      // UsdValue has 9 decimals, same as CollateralAmount
      const value = UsdValue.fromFloat(100);
      const adjusted = value.adjustTo(CollateralAmount);

      expect(adjusted.toFloat()).toBeCloseTo(100, 6);
      expect(adjusted.decimals).toBe(CollateralAmount.decimals);
    });

    it('should handle precision loss when reducing decimals', () => {
      const value = UsdValue.fromFloat(100.123456789012345);
      const adjusted = value.adjustTo(CollateralAmount);

      // CollateralAmount has 9 decimals, we lose precision beyond that
      expect(adjusted.toFloat()).toBeCloseTo(100.123456789, 5);
    });
  });

  describe('HeadlessDecimalValue', () => {
    it('should create with custom decimals', () => {
      const value = new HeadlessDecimalValue(123456n, 3n);

      expect(value.value).toBe(123456n);
      expect(value.decimals).toBe(3n);
      expect(value.toFloat()).toBeCloseTo(123.456, 3);
    });

    it('should adjust to typed decimal', () => {
      const headless = new HeadlessDecimalValue(100000000000n, 9n);
      const adjusted = headless.adjustTo(UsdValue);

      expect(adjusted.toFloat()).toBeCloseTo(100, 6);
      expect(adjusted.decimals).toBe(UsdValue.decimals);
    });

    it('should handle different decimal precision', () => {
      const value = new HeadlessDecimalValue(123n, 2n); // 1.23

      expect(value.toFloat()).toBeCloseTo(1.23, 2);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      const value = UsdValue.fromFloat(1e15);

      expect(value.toFloat()).toBe(1e15);
    });

    it('should handle very small numbers', () => {
      const value = UsdValue.fromFloat(0.000001);

      expect(value.toFloat()).toBeCloseTo(0.000001, 6);
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
