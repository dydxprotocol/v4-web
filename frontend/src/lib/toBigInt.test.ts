import { describe, expect, it } from 'vitest';
import './toBigInt';

describe('toBigInt', () => {
  describe('String.prototype.toBigInt', () => {
    it('converts numeric string to bigint', () => {
      expect('123'.toBigInt()).toBe(123n);
      expect('0'.toBigInt()).toBe(0n);
      expect('1000000'.toBigInt()).toBe(1000000n);
    });

    it('converts negative numeric string to bigint', () => {
      expect('-123'.toBigInt()).toBe(-123n);
      expect('-1000000'.toBigInt()).toBe(-1000000n);
    });

    it('handles very large numbers', () => {
      const largeNumber = '123456789012345678901234567890';
      expect(largeNumber.toBigInt()).toBe(123456789012345678901234567890n);
    });

    it('throws for non-numeric strings', () => {
      expect(() => 'abc'.toBigInt()).toThrow();
      expect(() => '12.34'.toBigInt()).toThrow();
    });

    it('handles empty string as zero', () => {
      expect(''.toBigInt()).toBe(0n);
    });

    it('trims whitespace from strings', () => {
      expect(' 123'.toBigInt()).toBe(123n);
      expect('123 '.toBigInt()).toBe(123n);
      expect(' 123 '.toBigInt()).toBe(123n);
    });
  });
});
