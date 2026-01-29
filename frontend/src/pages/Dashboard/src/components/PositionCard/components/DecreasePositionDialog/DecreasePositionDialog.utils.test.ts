import { PositionSize } from 'fuel-ts-sdk/trading';
import { describe, expect, it } from 'vitest';
import {
  calculateSizeFromPercentage,
  calculateSliderPercentage,
  getPositionAction,
  isValidDecreaseAmount,
} from './DecreasePositionDialog.utils';

describe('DecreasePositionDialog.utils', () => {
  describe('calculateSliderPercentage', () => {
    it('returns 0 for empty size string', () => {
      const result = calculateSliderPercentage('', PositionSize.fromFloat(1000));
      expect(result).toBe('0');
    });

    it('returns 0 for zero total position size', () => {
      const result = calculateSliderPercentage('100', PositionSize.fromFloat(0));
      expect(result).toBe('0');
    });

    it('calculates 50% correctly', () => {
      const result = calculateSliderPercentage('500', PositionSize.fromFloat(1000));
      expect(result).toBe('50');
    });

    it('calculates 100% correctly', () => {
      const result = calculateSliderPercentage('1000', PositionSize.fromFloat(1000));
      expect(result).toBe('100');
    });

    it('calculates 25% correctly', () => {
      const result = calculateSliderPercentage('250', PositionSize.fromFloat(1000));
      expect(result).toBe('25');
    });

    it('clamps values above 100% to 100', () => {
      const result = calculateSliderPercentage('1500', PositionSize.fromFloat(1000));
      expect(result).toBe('100');
    });

    it('clamps negative values to 0', () => {
      const result = calculateSliderPercentage('-100', PositionSize.fromFloat(1000));
      expect(result).toBe('0');
    });

    it('returns decimal percentage string', () => {
      const result = calculateSliderPercentage('333', PositionSize.fromFloat(1000));
      expect(result).toBe('33.3');
    });

    it('handles decimal input values', () => {
      const result = calculateSliderPercentage('100.5', PositionSize.fromFloat(1000));
      expect(result).toBe('10.05');
    });

    it('handles small position sizes', () => {
      const result = calculateSliderPercentage('0.5', PositionSize.fromFloat(1));
      expect(result).toBe('50');
    });
  });

  describe('calculateSizeFromPercentage', () => {
    it('returns "0" for 0%', () => {
      const result = calculateSizeFromPercentage('0', PositionSize.fromFloat(1000));
      expect(result).toBe('0');
    });

    it('calculates 50% of position size', () => {
      const result = calculateSizeFromPercentage('50', PositionSize.fromFloat(1000));
      expect(Number(result)).toBeCloseTo(500, 2);
    });

    it('calculates 100% of position size', () => {
      const result = calculateSizeFromPercentage('100', PositionSize.fromFloat(1000));
      expect(Number(result)).toBeCloseTo(1000, 2);
    });

    it('calculates 25% of position size', () => {
      const result = calculateSizeFromPercentage('25', PositionSize.fromFloat(1000));
      expect(Number(result)).toBeCloseTo(250, 2);
    });

    it('handles decimal percentages', () => {
      const result = calculateSizeFromPercentage('33.33', PositionSize.fromFloat(1000));
      expect(Number(result)).toBeCloseTo(333.3, 1);
    });

    it('handles small position sizes', () => {
      const result = calculateSizeFromPercentage('50', PositionSize.fromFloat(0.1));
      expect(Number(result)).toBeCloseTo(0.05, 4);
    });

    it('handles large position sizes', () => {
      const result = calculateSizeFromPercentage('10', PositionSize.fromFloat(1000000));
      expect(Number(result)).toBeCloseTo(100000, 0);
    });
  });

  describe('isValidDecreaseAmount', () => {
    it('returns false for empty string', () => {
      const result = isValidDecreaseAmount('', PositionSize.fromFloat(1000));
      expect(result).toBe(false);
    });

    it('returns false for zero amount', () => {
      const result = isValidDecreaseAmount('0', PositionSize.fromFloat(1000));
      expect(result).toBe(false);
    });

    it('returns false for negative amount', () => {
      const result = isValidDecreaseAmount('-100', PositionSize.fromFloat(1000));
      expect(result).toBe(false);
    });

    it('returns true for valid amount less than total', () => {
      const result = isValidDecreaseAmount('500', PositionSize.fromFloat(1000));
      expect(result).toBe(true);
    });

    it('returns true for amount equal to total', () => {
      const result = isValidDecreaseAmount('1000', PositionSize.fromFloat(1000));
      expect(result).toBe(true);
    });

    it('returns false for amount exceeding total', () => {
      const result = isValidDecreaseAmount('1500', PositionSize.fromFloat(1000));
      expect(result).toBe(false);
    });

    it('returns true for decimal amounts within range', () => {
      const result = isValidDecreaseAmount('500.5', PositionSize.fromFloat(1000));
      expect(result).toBe(true);
    });

    it('returns false for non-numeric strings', () => {
      const result = isValidDecreaseAmount('abc', PositionSize.fromFloat(1000));
      expect(result).toBe(false);
    });

    it('handles very small valid amounts', () => {
      const result = isValidDecreaseAmount('0.000001', PositionSize.fromFloat(1));
      expect(result).toBe(true);
    });
  });

  describe('getPositionAction', () => {
    it('returns "close" for 100%', () => {
      const result = getPositionAction('100');
      expect(result).toBe('close');
    });

    it('returns "decrease" for 99%', () => {
      const result = getPositionAction('99');
      expect(result).toBe('decrease');
    });

    it('returns "decrease" for 50%', () => {
      const result = getPositionAction('50');
      expect(result).toBe('decrease');
    });

    it('returns "decrease" for 0%', () => {
      const result = getPositionAction('0');
      expect(result).toBe('decrease');
    });

    it('returns "decrease" for 1%', () => {
      const result = getPositionAction('1');
      expect(result).toBe('decrease');
    });
  });
});
