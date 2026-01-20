import { describe, expect, it } from 'vitest';
import './toBigInt';

describe('toBigInt', () => {
  describe('String.prototype.toBigInt', () => {
    describe('valid integer strings', () => {
      it('converts positive numeric string to bigint', () => {
        expect('123'.toBigInt()).toBe(123n);
        expect('0'.toBigInt()).toBe(0n);
        expect('1000000'.toBigInt()).toBe(1000000n);
      });

      it('converts negative numeric string to bigint', () => {
        expect('-123'.toBigInt()).toBe(-123n);
        expect('-0'.toBigInt()).toBe(0n);
        expect('-1000000'.toBigInt()).toBe(-1000000n);
      });

      it('converts string with explicit positive sign to bigint', () => {
        expect('+123'.toBigInt()).toBe(123n);
        expect('+0'.toBigInt()).toBe(0n);
        expect('+1000000'.toBigInt()).toBe(1000000n);
      });

      it('handles very large numbers', () => {
        const largeNumber = '123456789012345678901234567890';
        expect(largeNumber.toBigInt()).toBe(123456789012345678901234567890n);
      });

      it('handles very large negative numbers', () => {
        const largeNegative = '-123456789012345678901234567890';
        expect(largeNegative.toBigInt()).toBe(-123456789012345678901234567890n);
      });

      it('trims leading whitespace', () => {
        expect(' 123'.toBigInt()).toBe(123n);
        expect('  456'.toBigInt()).toBe(456n);
        expect('\t789'.toBigInt()).toBe(789n);
        expect('\n100'.toBigInt()).toBe(100n);
      });

      it('trims trailing whitespace', () => {
        expect('123 '.toBigInt()).toBe(123n);
        expect('456  '.toBigInt()).toBe(456n);
        expect('789\t'.toBigInt()).toBe(789n);
        expect('100\n'.toBigInt()).toBe(100n);
      });

      it('trims whitespace from both ends', () => {
        expect(' 123 '.toBigInt()).toBe(123n);
        expect('  -456  '.toBigInt()).toBe(-456n);
        expect('\t+789\n'.toBigInt()).toBe(789n);
      });
    });

    describe('invalid strings throw TypeError', () => {
      it('throws for empty string', () => {
        expect(() => ''.toBigInt()).toThrow(TypeError);
        expect(() => ''.toBigInt()).toThrow("toBigInt: invalid integer string: ''");
      });

      it('throws for whitespace-only string', () => {
        expect(() => ' '.toBigInt()).toThrow(TypeError);
        expect(() => '   '.toBigInt()).toThrow(TypeError);
        expect(() => '\t'.toBigInt()).toThrow(TypeError);
        expect(() => '\n'.toBigInt()).toThrow(TypeError);
      });

      it('throws for decimal numbers', () => {
        expect(() => '12.34'.toBigInt()).toThrow(TypeError);
        expect(() => '12.34'.toBigInt()).toThrow("toBigInt: invalid integer string: '12.34'");
        expect(() => '0.5'.toBigInt()).toThrow(TypeError);
        expect(() => '.5'.toBigInt()).toThrow(TypeError);
        expect(() => '5.'.toBigInt()).toThrow(TypeError);
      });

      it('throws for alphabetic strings', () => {
        expect(() => 'abc'.toBigInt()).toThrow(TypeError);
        expect(() => 'abc'.toBigInt()).toThrow("toBigInt: invalid integer string: 'abc'");
      });

      it('throws for mixed alphanumeric strings', () => {
        expect(() => '123abc'.toBigInt()).toThrow(TypeError);
        expect(() => 'abc123'.toBigInt()).toThrow(TypeError);
        expect(() => '12a34'.toBigInt()).toThrow(TypeError);
      });

      it('throws for strings with special characters', () => {
        expect(() => '12$34'.toBigInt()).toThrow(TypeError);
        expect(() => '12,345'.toBigInt()).toThrow(TypeError);
        expect(() => '1_000'.toBigInt()).toThrow(TypeError);
      });

      it('throws for scientific notation', () => {
        expect(() => '1e10'.toBigInt()).toThrow(TypeError);
        expect(() => '1E10'.toBigInt()).toThrow(TypeError);
        expect(() => '1.5e10'.toBigInt()).toThrow(TypeError);
      });

      it('throws for hexadecimal notation', () => {
        expect(() => '0x10'.toBigInt()).toThrow(TypeError);
        expect(() => '0X10'.toBigInt()).toThrow(TypeError);
      });

      it('throws for octal notation', () => {
        expect(() => '0o10'.toBigInt()).toThrow(TypeError);
        expect(() => '0O10'.toBigInt()).toThrow(TypeError);
      });

      it('throws for binary notation', () => {
        expect(() => '0b10'.toBigInt()).toThrow(TypeError);
        expect(() => '0B10'.toBigInt()).toThrow(TypeError);
      });

      it('throws for multiple signs', () => {
        expect(() => '++123'.toBigInt()).toThrow(TypeError);
        expect(() => '--123'.toBigInt()).toThrow(TypeError);
        expect(() => '+-123'.toBigInt()).toThrow(TypeError);
        expect(() => '-+123'.toBigInt()).toThrow(TypeError);
      });

      it('throws for sign in wrong position', () => {
        expect(() => '123-'.toBigInt()).toThrow(TypeError);
        expect(() => '123+'.toBigInt()).toThrow(TypeError);
        expect(() => '12-3'.toBigInt()).toThrow(TypeError);
      });

      it('throws for sign only', () => {
        expect(() => '+'.toBigInt()).toThrow(TypeError);
        expect(() => '-'.toBigInt()).toThrow(TypeError);
      });

      it('includes original value in error message', () => {
        expect(() => '  bad input  '.toBigInt()).toThrow(
          "toBigInt: invalid integer string: '  bad input  '"
        );
      });
    });
  });
});
