import { $decimalValue } from '@sdk/shared/models/DecimalValue';
import { CollateralAmount, UsdValue } from '@sdk/shared/models/decimals';
import { describe, expect, it } from 'vitest';
import { DecimalCalculator } from './DecimalCalculator';

describe('DecimalCalculator', () => {
  describe('basic arithmetic', () => {
    it('should add two values', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(50);

      const result = DecimalCalculator.first(a).add(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(150);
    });

    it('should subtract values', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(30);

      const result = DecimalCalculator.first(a).subtractBy(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(70);
    });

    it('should multiply values', () => {
      const a = UsdValue.fromFloat(10);
      const b = UsdValue.fromFloat(5);

      const result = DecimalCalculator.first(a).multiplyBy(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(50);
    });

    it('should divide values', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(4);

      const result = DecimalCalculator.first(a).divideBy(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(25);
    });
  });

  describe('complex calculations', () => {
    it('should handle chained operations', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(50);
      const c = UsdValue.fromFloat(2);

      // (100 + 50) * 2 = 300
      const result = DecimalCalculator.first(a).add(b).multiplyBy(c).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(300);
    });

    it('should handle division with remainder', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(3);

      const result = DecimalCalculator.first(a).divideBy(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBeCloseTo(33.3333, 4);
    });

    it('should handle complex denominator', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(10);
      const c = UsdValue.fromFloat(5);

      // 100 / (10 + 5) = 100 / 15 = 6.666...
      const result = DecimalCalculator.first(a)
        .inDenominator((calc) => calc.value(b).add(c))
        .calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBeCloseTo(6.6667, 4);
    });

    it('should handle numerator with operations', () => {
      const a = UsdValue.fromFloat(50);
      const b = UsdValue.fromFloat(30);
      const c = UsdValue.fromFloat(4);

      // (50 + 30) / 4 = 80 / 4 = 20
      const result = DecimalCalculator.inNumerator((calc) => calc.value(a).add(b))
        .divideBy(c)
        .calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(20);
    });
  });

  describe('different decimal types', () => {
    it('should work with different decimal value types', () => {
      const collateral = CollateralAmount.fromFloat(1000);
      const price = UsdValue.fromFloat(2);

      const result = DecimalCalculator.first(collateral).multiplyBy(price).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(2000);
    });

    it('should adjust decimals when calculating result', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(2);

      const result = DecimalCalculator.first(a).multiplyBy(b).calculate(CollateralAmount);

      expect($decimalValue(result).toFloat()).toBe(200);
      expect(result.decimals).toBe(CollateralAmount.decimals);
    });
  });

  describe('error handling', () => {
    it('should throw error when trying to initialize populated formula', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(50);

      expect(() => {
        DecimalCalculator.first(a).value(b);
      }).toThrow('Cannot initialize a populated formula');
    });

    it('should throw error when denominator is invoked before numerator', () => {
      const a = UsdValue.fromFloat(100);

      expect(() => {
        new (DecimalCalculator as any)().divideBy(a);
      }).toThrow('Denominator cannot be invoked before numerator');
    });

    it('should throw error for consecutive denominator invocation', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(50);
      const c = UsdValue.fromFloat(2);

      expect(() => {
        DecimalCalculator.first(a).divideBy(b).divideBy(c);
      }).toThrow('Illegal consecutive denominator invocation');
    });

    it('should throw error for nested denominator formulas', () => {
      const a = UsdValue.fromFloat(100);
      const b = UsdValue.fromFloat(50);

      expect(() => {
        DecimalCalculator.first(a).inDenominator((calc) => calc.value(b).divideBy(a));
      }).toThrow('Denominator formula cannot have nested denominator formulas');
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const zero = UsdValue.fromFloat(0);
      const value = UsdValue.fromFloat(100);

      const result = DecimalCalculator.first(zero).add(value).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(100);
    });

    it('should handle negative values', () => {
      const a = UsdValue.fromFloat(50);
      const b = UsdValue.fromFloat(100);

      const result = DecimalCalculator.first(a).subtractBy(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(-50);
    });

    it('should handle very large numbers', () => {
      const a = UsdValue.fromFloat(1e12);
      const b = UsdValue.fromFloat(2);

      const result = DecimalCalculator.first(a).multiplyBy(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBe(2e12);
    });

    it('should handle very small numbers', () => {
      const a = UsdValue.fromFloat(0.0001);
      const b = UsdValue.fromFloat(2);

      const result = DecimalCalculator.first(a).multiplyBy(b).calculate(UsdValue);

      expect($decimalValue(result).toFloat()).toBeCloseTo(0.0002, 6);
    });
  });
});
