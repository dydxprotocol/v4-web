import { describe, expect, it } from 'vitest';
import {
  calculatePnlPercent,
  formatPercent,
  formatPnl,
  formatPrice,
  formatUsd,
  isProfitable,
} from './PositionCard.utils';

describe('PositionCard.utils', () => {
  describe('formatUsd', () => {
    it('formats positive number with 2 decimals', () => {
      expect(formatUsd(1234.56)).toBe('1,234.56');
    });

    it('formats zero', () => {
      expect(formatUsd(0)).toBe('0.00');
    });

    it('formats large numbers with thousand separators', () => {
      expect(formatUsd(1000000)).toBe('1,000,000.00');
    });

    it('formats negative numbers', () => {
      expect(formatUsd(-1234.56)).toBe('-1,234.56');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatUsd(1234.567)).toBe('1,234.57');
    });

    it('pads single decimal to 2 places', () => {
      expect(formatUsd(1234.5)).toBe('1,234.50');
    });

    it('handles very small numbers', () => {
      expect(formatUsd(0.01)).toBe('0.01');
    });

    it('handles integers', () => {
      expect(formatUsd(100)).toBe('100.00');
    });
  });

  describe('formatPrice', () => {
    it('formats price with 2 decimals', () => {
      expect(formatPrice(45678.9)).toBe('45,678.90');
    });

    it('formats zero price', () => {
      expect(formatPrice(0)).toBe('0.00');
    });

    it('formats large prices', () => {
      expect(formatPrice(100000.5)).toBe('100,000.50');
    });
  });

  describe('formatPnl', () => {
    it('formats positive PnL with + sign', () => {
      expect(formatPnl(1234.56)).toBe('+$1,234.56');
    });

    it('formats negative PnL with - sign', () => {
      expect(formatPnl(-1234.56)).toBe('-$1,234.56');
    });

    it('formats zero as positive', () => {
      expect(formatPnl(0)).toBe('+$0.00');
    });

    it('formats small positive PnL', () => {
      expect(formatPnl(0.01)).toBe('+$0.01');
    });

    it('formats small negative PnL', () => {
      expect(formatPnl(-0.01)).toBe('-$0.01');
    });

    it('formats large positive PnL', () => {
      expect(formatPnl(1000000)).toBe('+$1,000,000.00');
    });

    it('formats large negative PnL', () => {
      expect(formatPnl(-1000000)).toBe('-$1,000,000.00');
    });
  });

  describe('formatPercent', () => {
    it('formats positive percentage with + sign', () => {
      expect(formatPercent(12.34)).toBe('+12.34%');
    });

    it('formats negative percentage with - sign', () => {
      expect(formatPercent(-5.5)).toBe('-5.50%');
    });

    it('formats zero as positive', () => {
      expect(formatPercent(0)).toBe('+0.00%');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatPercent(12.345)).toBe('+12.35%');
    });

    it('handles very small percentages', () => {
      expect(formatPercent(0.01)).toBe('+0.01%');
    });

    it('handles large percentages', () => {
      expect(formatPercent(150.5)).toBe('+150.50%');
    });

    it('handles large negative percentages', () => {
      expect(formatPercent(-99.99)).toBe('-99.99%');
    });
  });

  describe('calculatePnlPercent', () => {
    it('calculates 10% profit correctly', () => {
      expect(calculatePnlPercent(100, 1000)).toBe(10);
    });

    it('calculates negative percentage correctly', () => {
      expect(calculatePnlPercent(-50, 500)).toBe(-10);
    });

    it('returns 0 for zero PnL', () => {
      expect(calculatePnlPercent(0, 1000)).toBe(0);
    });

    it('returns 0 for zero collateral', () => {
      expect(calculatePnlPercent(100, 0)).toBe(0);
    });

    it('handles 100% gain', () => {
      expect(calculatePnlPercent(1000, 1000)).toBe(100);
    });

    it('handles over 100% gain', () => {
      expect(calculatePnlPercent(2000, 1000)).toBe(200);
    });

    it('handles fractional percentages', () => {
      expect(calculatePnlPercent(1, 1000)).toBeCloseTo(0.1, 5);
    });
  });

  describe('isProfitable', () => {
    it('returns true for positive PnL', () => {
      expect(isProfitable(100)).toBe(true);
    });

    it('returns true for zero PnL', () => {
      expect(isProfitable(0)).toBe(true);
    });

    it('returns false for negative PnL', () => {
      expect(isProfitable(-100)).toBe(false);
    });

    it('returns true for very small positive PnL', () => {
      expect(isProfitable(0.0001)).toBe(true);
    });

    it('returns false for very small negative PnL', () => {
      expect(isProfitable(-0.0001)).toBe(false);
    });
  });
});
