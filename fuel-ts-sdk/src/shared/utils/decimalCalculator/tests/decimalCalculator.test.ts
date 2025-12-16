import { describe, expect, it } from 'vitest';

import { DecimalCalculator } from '..';
import { DecimalValue } from '../../../models/decimalValue';

// Test-specific DecimalValue classes
class USD extends DecimalValue {
  declare __brand: typeof USD;
  static decimals = 15n as const;
}

class SIZE extends DecimalValue {
  declare __brand: typeof SIZE;
  static decimals = 18n as const;
}

class PRICE extends DecimalValue {
  declare __brand: typeof PRICE;
  static decimals = 18n as const;
}

class BTC extends DecimalValue {
  declare __brand: typeof BTC;
  static decimals = 4n as const;
}

class TWO extends DecimalValue {
  declare __brand: typeof TWO;
  static decimals = 2n as const;
}

class FOUR extends DecimalValue {
  declare __brand: typeof FOUR;
  static decimals = 4n as const;
}

class SIX extends DecimalValue {
  declare __brand: typeof SIX;
  static decimals = 6n as const;
}

class SMALL extends DecimalValue {
  declare __brand: typeof SMALL;
  static decimals = 2n as const;
}

class LARGE extends DecimalValue {
  declare __brand: typeof LARGE;
  static decimals = 30n as const;
}

describe('DecimalCalculator', () => {
  describe('basic multiplication', () => {
    it('should multiply two values and scale to target precision', () => {
      const price = new PRICE(3n * 10n ** 18n);
      const size = new SIZE(16n * 10n ** 18n);

      const result = DecimalCalculator.first(price).multiplyBy(size).calculate(USD);

      expect(result.value).toBe(48n * 10n ** 15n);
    });

    it('should handle single token multiplication', () => {
      const price = new PRICE(50000n * 10n ** 18n);
      const size = new SIZE(2n * 10n ** 18n);

      const result = DecimalCalculator.first(size).multiplyBy(price).calculate(USD);

      expect(result.value).toBe(100000n * 10n ** 15n);
    });

    it('should preserve precision when multiplying small values', () => {
      const price = new PRICE(1n * 10n ** 17n);
      const size = new SIZE(5n * 10n ** 17n);

      const result = DecimalCalculator.first(price).multiplyBy(size).calculate(USD);

      expect(result.value).toBe(5n * 10n ** 13n);
    });

    it('should handle multiple multiplications', () => {
      const a = new SIZE(2n * 10n ** 18n);
      const b = new SIZE(3n * 10n ** 18n);
      const c = new SIZE(4n * 10n ** 18n);

      const result = DecimalCalculator.first(a).multiplyBy(b).multiplyBy(c).calculate(PRICE);

      expect(result.value).toBe(24n * 10n ** 18n);
    });
  });

  describe('basic division', () => {
    it('should divide two values and scale to target precision', () => {
      const totalUsd = new USD(100n * 10n ** 15n);
      const size = new SIZE(2n * 10n ** 18n);

      const result = DecimalCalculator.first(totalUsd).divideBy(size).calculate(PRICE);

      expect(result.value).toBe(50n * 10n ** 18n);
    });

    it('should handle division resulting in fractional values', () => {
      const totalUsd = new USD(75n * 10n ** 15n);
      const size = new SIZE(3n * 10n ** 18n);

      const result = DecimalCalculator.first(totalUsd).divideBy(size).calculate(PRICE);

      expect(result.value).toBe(25n * 10n ** 18n);
    });

    it('should truncate when division has remainder', () => {
      const totalUsd = new USD(100n * 10n ** 15n);
      const size = new SIZE(3n * 10n ** 18n);

      const result = DecimalCalculator.first(totalUsd).divideBy(size).calculate(PRICE);

      // 100 / 3 = 33.333... in PRICE (18 decimals)
      expect(result.value).toBe(33333333333333333333n);
    });

    it('should handle division with denominator multiplication: a / (b * c)', () => {
      const start = new PRICE(1000n * 10n ** 18n);
      const div1 = new SIZE(2n * 10n ** 18n);
      const div2 = new SIZE(5n * 10n ** 18n);

      const result = DecimalCalculator.first(start)
        .inDenominator((builder) => builder.value(div1).multiplyBy(div2))
        .calculate(USD);

      expect(result.value).toBe(100n * 10n ** 15n);
    });
  });

  describe('addition and subtraction', () => {
    it('should add values with same decimals', () => {
      const a = new USD(1000n * 10n ** 15n);
      const b = new USD(500n * 10n ** 15n);

      const result = DecimalCalculator.first(a).add(b).calculate(USD);

      expect(result.value).toBe(1500n * 10n ** 15n);
    });

    it('should subtract values with same decimals', () => {
      const a = new USD(1000n * 10n ** 15n);
      const b = new USD(300n * 10n ** 15n);

      const result = DecimalCalculator.first(a).subtractBy(b).calculate(USD);

      expect(result.value).toBe(700n * 10n ** 15n);
    });

    it('should add values with different decimals by scaling to larger precision', () => {
      const usdAmount = new TWO(4567n);
      const btcAmount = new BTC(12345n);

      const result = DecimalCalculator.first(usdAmount).add(btcAmount).calculate(BTC);

      expect(result.value).toBe(469045n);
    });

    it('should subtract values with different decimals by scaling to larger precision', () => {
      const usdAmount = new TWO(5000n);
      const btcAmount = new BTC(12345n);

      const result = DecimalCalculator.first(usdAmount).subtractBy(btcAmount).calculate(BTC);

      expect(result.value).toBe(487655n);
    });

    it('should handle chain of additions with different precisions', () => {
      const a = new TWO(100n);
      const b = new FOUR(5000n);
      const c = new SIX(250000n);

      const result = DecimalCalculator.first(a).add(b).add(c).calculate(SIX);

      expect(result.value).toBe(1750000n);
    });
  });

  describe('complex formulas', () => {
    it('should handle (a * b) / (c * d)', () => {
      const a = new SIZE(10n * 10n ** 18n);
      const b = new PRICE(5n * 10n ** 18n);
      const c = new SIZE(2n * 10n ** 18n);
      const d = new SIZE(5n * 10n ** 18n);

      const result = DecimalCalculator.first(a)
        .multiplyBy(b)
        .inDenominator((builder) => builder.value(c).multiplyBy(d))
        .calculate(USD);

      expect(result.value).toBe(5n * 10n ** 15n);
    });

    it('should handle (a + b) / c', () => {
      const a = new USD(100n * 10n ** 15n);
      const b = new USD(50n * 10n ** 15n);
      const c = new SIZE(3n * 10n ** 18n);

      const result = DecimalCalculator.first(a).add(b).divideBy(c).calculate(PRICE);

      expect(result.value).toBe(50n * 10n ** 18n);
    });

    it('should handle (a - b) / c', () => {
      const a = new USD(100n * 10n ** 15n);
      const b = new USD(25n * 10n ** 15n);
      const c = new SIZE(5n * 10n ** 18n);

      const result = DecimalCalculator.first(a).subtractBy(b).divideBy(c).calculate(PRICE);

      expect(result.value).toBe(15n * 10n ** 18n);
    });

    it('should handle (a * b + c) / d', () => {
      const a = new SIZE(10n * 10n ** 18n);
      const b = new SIZE(5n * 10n ** 18n);
      const c = new SIZE(20n * 10n ** 18n);
      const d = new SIZE(2n * 10n ** 18n);

      const result = DecimalCalculator.first(a).multiplyBy(b).add(c).divideBy(d).calculate(SIZE);

      expect(result.value).toBe(35n * 10n ** 18n);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const zero = new PRICE(0n);
      const size = new SIZE(10n * 10n ** 18n);

      const result = DecimalCalculator.first(zero).multiplyBy(size).calculate(USD);

      expect(result.value).toBe(0n);
    });

    it('should handle identity multiplication (x * 1)', () => {
      const value = new SIZE(42n * 10n ** 18n);
      const one = new SIZE(1n * 10n ** 18n);

      const result = DecimalCalculator.first(value).multiplyBy(one).calculate(PRICE);

      expect(result.value).toBe(42n * 10n ** 18n);
    });

    it('should handle identity division (x / 1)', () => {
      const value = new USD(42n * 10n ** 15n);
      const one = new SIZE(1n * 10n ** 18n);

      const result = DecimalCalculator.first(value).divideBy(one).calculate(PRICE);

      expect(result.value).toBe(42n * 10n ** 18n);
    });

    it('should handle very large numbers', () => {
      const largePrice = new PRICE(1000000n * 10n ** 18n);
      const largeSize = new SIZE(500000n * 10n ** 18n);

      const result = DecimalCalculator.first(largePrice).multiplyBy(largeSize).calculate(USD);

      expect(result.value).toBe(500000000000n * 10n ** 15n);
    });
  });

  describe('real-world DeFi scenarios', () => {
    it('should calculate notional value (size * price)', () => {
      const btcAmount = new SIZE(15n * 10n ** 17n);
      const btcPrice = new PRICE(45000n * 10n ** 18n);

      const notional = DecimalCalculator.first(btcAmount).multiplyBy(btcPrice).calculate(USD);

      expect(notional.value).toBe(67500n * 10n ** 15n);
    });

    it('should calculate average entry price (totalCollateral / totalSize)', () => {
      const totalCollateral = new USD(45000n * 10n ** 15n);
      const totalSize = new SIZE(1n * 10n ** 18n);

      const avgPrice = DecimalCalculator.first(totalCollateral)
        .divideBy(totalSize)
        .calculate(PRICE);

      expect(avgPrice.value).toBe(45000n * 10n ** 18n);
    });

    it('should calculate leverage (notional / equity)', () => {
      const notional = new USD(100000n * 10n ** 15n);
      const equity = new USD(10000n * 10n ** 15n);

      const leverage = DecimalCalculator.first(notional).divideBy(equity).calculate(USD);

      expect(leverage.value).toBe(10n * 10n ** 15n);
    });

    it('should calculate unrealized PnL: (currentPrice - entryPrice) * size', () => {
      const currentPrice = new PRICE(45000n * 10n ** 18n);
      const entryPrice = new PRICE(40000n * 10n ** 18n);
      const size = new SIZE(2n * 10n ** 18n);

      const priceDiff = new PRICE(currentPrice.value - entryPrice.value); // 5000 * 10^18

      const pnl = DecimalCalculator.first(priceDiff).multiplyBy(size).calculate(USD);

      // (45000 - 40000) * 2 = 5000 * 2 = 10000 in USD (15 decimals)
      expect(pnl.value).toBe(10000n * 10n ** 15n);
    });

    it('should calculate weighted average price with multiple purchases', () => {
      const purchase1Size = new SIZE(1n * 10n ** 18n);
      const purchase1Cost = new USD(40000n * 10n ** 15n);

      const purchase2Size = new SIZE(2n * 10n ** 18n);
      const purchase2Cost = new USD(90000n * 10n ** 15n);

      const totalCost = new USD(purchase1Cost.value + purchase2Cost.value);
      const totalSize = new SIZE(purchase1Size.value + purchase2Size.value);

      const avgPrice = DecimalCalculator.first(totalCost).divideBy(totalSize).calculate(PRICE);

      // 130000 / 3 = 43333.333... in PRICE (18 decimals)
      // 43333.333 * 10^18 ≈ 43333333333333333333333
      expect(avgPrice.value).toBe(43333333333333333333333n);
    });

    it('should calculate liquidation price: (collateral - debt) / size', () => {
      const collateral = new USD(50000n * 10n ** 15n);
      const debt = new USD(30000n * 10n ** 15n);
      const size = new SIZE(1n * 10n ** 18n);

      const liqPrice = DecimalCalculator.first(collateral)
        .subtractBy(debt)
        .divideBy(size)
        .calculate(PRICE);

      expect(liqPrice.value).toBe(20000n * 10n ** 18n);
    });

    it('should calculate funding rate impact: (rate * notional) / 100', () => {
      const fundingRateBps = new USD(5n * 10n ** 15n); // 5 in USD precision
      const notional = new USD(100000n * 10n ** 15n); // 100000 in USD precision
      const hundred = new USD(100n * 10n ** 15n); // 100 in USD precision

      const fundingPayment = DecimalCalculator.first(fundingRateBps)
        .multiplyBy(notional)
        .divideBy(hundred)
        .calculate(USD);

      // (5 * 100000) / 100 = 5000 in USD (15 decimals)
      expect(fundingPayment.value).toBe(5000n * 10n ** 15n);
    });
  });

  describe('numerator-only formulas', () => {
    it('should handle calculation without denominator (multiplication only)', () => {
      const a = new SIZE(10n * 10n ** 18n);
      const b = new PRICE(5n * 10n ** 18n);

      const result = DecimalCalculator.first(a).multiplyBy(b).calculate(USD);

      expect(result.value).toBe(50n * 10n ** 15n);
    });

    it('should handle calculation without denominator (addition only)', () => {
      const a = new USD(100n * 10n ** 15n);
      const b = new USD(50n * 10n ** 15n);

      const result = DecimalCalculator.first(a).add(b).calculate(USD);

      expect(result.value).toBe(150n * 10n ** 15n);
    });

    it('should handle calculation without denominator (mixed operations)', () => {
      const a = new SIZE(10n * 10n ** 18n);
      const b = new SIZE(5n * 10n ** 18n);
      const c = new SIZE(20n * 10n ** 18n);

      const result = DecimalCalculator.first(a).multiplyBy(b).add(c).calculate(SIZE);

      expect(result.value).toBe(70n * 10n ** 18n);
    });
  });

  describe('denominator operations', () => {
    it('should handle addition in denominator: a / (b + c)', () => {
      const a = new USD(100n * 10n ** 15n);
      const b = new SIZE(2n * 10n ** 18n);
      const c = new SIZE(3n * 10n ** 18n);

      const result = DecimalCalculator.first(a)
        .inDenominator((builder) => builder.value(b).add(c))
        .calculate(PRICE);

      expect(result.value).toBe(20n * 10n ** 18n);
    });

    it('should handle subtraction in denominator: a / (b - c)', () => {
      const a = new USD(100n * 10n ** 15n);
      const b = new SIZE(5n * 10n ** 18n);
      const c = new SIZE(3n * 10n ** 18n);

      const result = DecimalCalculator.first(a)
        .inDenominator((builder) => builder.value(b).subtractBy(c))
        .calculate(PRICE);

      expect(result.value).toBe(50n * 10n ** 18n);
    });

    it('should handle mixed operations in denominator: a / (b * c + d)', () => {
      const a = new USD(200n * 10n ** 15n);
      const b = new SIZE(2n * 10n ** 18n);
      const c = new SIZE(3n * 10n ** 18n);
      const d = new SIZE(4n * 10n ** 18n);

      const result = DecimalCalculator.first(a)
        .inDenominator((builder) => builder.value(b).multiplyBy(c).add(d))
        .calculate(PRICE);

      expect(result.value).toBe(20n * 10n ** 18n);
    });
  });

  describe('mixed operations in numerator and denominator', () => {
    it('should handle (a * b - c) / d', () => {
      const a = new SIZE(10n * 10n ** 18n);
      const b = new SIZE(5n * 10n ** 18n);
      const c = new SIZE(20n * 10n ** 18n);
      const d = new SIZE(3n * 10n ** 18n);

      const result = DecimalCalculator.first(a)
        .multiplyBy(b)
        .subtractBy(c)
        .divideBy(d)
        .calculate(SIZE);

      expect(result.value).toBe(10n * 10n ** 18n);
    });

    it('should handle (a * b - c * d) / (e + f)', () => {
      const a = new SIZE(10n * 10n ** 18n);
      const b = new SIZE(8n * 10n ** 18n);
      // c = 2, d = 5, so c * d = 10
      const cd = new SIZE(10n * 10n ** 18n);
      const e = new SIZE(3n * 10n ** 18n);
      const f = new SIZE(2n * 10n ** 18n);

      const result = DecimalCalculator.first(a)
        .multiplyBy(b)
        .subtractBy(cd)
        .inDenominator((builder) => builder.value(e).add(f))
        .calculate(SIZE);

      // (10 * 8 - 10) / (3 + 2) = 70 / 5 = 14 in SIZE (18 decimals)
      expect(result.value).toBe(14n * 10n ** 18n);
    });
  });

  describe('scaling edge cases', () => {
    it('should handle zero decimal adjustment (same decimals in num and denom)', () => {
      const a = new SIZE(100n * 10n ** 18n);
      const b = new SIZE(10n * 10n ** 18n);

      const result = DecimalCalculator.first(a).divideBy(b).calculate(SIZE);

      // 100 * 10^18 / 10 * 10^18 = 10 (0 decimals) -> scale to 18 decimals
      expect(result.value).toBe(10n * 10n ** 18n);
    });

    it('should handle large upward scaling', () => {
      const a = new SMALL(100n); // 1.00 with 2 decimals

      const result = DecimalCalculator.first(a).calculate(LARGE);

      // Scale from 2d to 30d: multiply by 10^28
      expect(result.value).toBe(100n * 10n ** 28n);
    });

    it('should handle large downward scaling', () => {
      const a = new LARGE(100n * 10n ** 28n); // Value with 30 decimals

      const result = DecimalCalculator.first(a).calculate(SMALL);

      // Scale from 30d to 2d: divide by 10^28
      expect(result.value).toBe(100n);
    });
  });

  describe('then syntax', () => {
    it('should support .then for readability in chains', () => {
      const a = new SIZE(10n * 10n ** 18n);
      const b = new SIZE(5n * 10n ** 18n);
      const c = new SIZE(2n * 10n ** 18n);

      const result = DecimalCalculator.first(a).then.multiplyBy(b).then.add(c).calculate(SIZE);

      expect(result.value).toBe(52n * 10n ** 18n);
    });

    it('should support .then before .divideBy()', () => {
      const a = new USD(100n * 10n ** 15n);
      const b = new SIZE(5n * 10n ** 18n);

      const result = DecimalCalculator.first(a).then.divideBy(b).calculate(PRICE);

      expect(result.value).toBe(20n * 10n ** 18n);
    });
  });

  describe('error handling', () => {
    it('should throw error when calling .divideBy() then .divideBy() again', () => {
      const a = new USD(10n);
      const b = new SIZE(5n);
      const c = new PRICE(5n);

      expect(() => {
        DecimalCalculator.first(a).divideBy(b).divideBy(c);
      }).toThrow('Illegal consecutive denominator invocation');
    });

    it('should throw error when calling .value() after formula initialized', () => {
      const a = new USD(10n);
      const b = new SIZE(5n);

      expect(() => {
        DecimalCalculator.first(a).value(b);
      }).toThrow('Cannot initialize a populated formula');
    });

    it('should handle division by zero (throws in JavaScript)', () => {
      const a = new USD(100n * 10n ** 15n);
      const zero = new SIZE(0n);

      // BigInt division by zero throws in JavaScript
      expect(() => {
        DecimalCalculator.first(a).divideBy(zero).calculate(PRICE);
      }).toThrow();
    });
  });
});
