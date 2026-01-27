import { describe, expect, it, vi } from 'vitest';
import { monomemo, multimemo } from './memo';

describe('memo utilities', () => {
  describe('monomemo', () => {
    it('should memoize function results', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoized = monomemo(fn);

      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should recompute when arguments change', () => {
      const fn = vi.fn((a: number) => a * 2);
      const memoized = monomemo(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(3)).toBe(6);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should have cache size of 1', () => {
      const fn = vi.fn((a: number) => a * 2);
      const memoized = monomemo(fn);

      memoized(1); // cached
      memoized(2); // evicts 1, caches 2
      memoized(1); // cache miss, recomputes

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should compare arguments by reference for objects', () => {
      const fn = vi.fn((obj: { value: number }) => obj.value * 2);
      const memoized = monomemo(fn);

      const obj1 = { value: 5 };
      const obj2 = { value: 5 }; // same value, different reference

      expect(memoized(obj1)).toBe(10);
      expect(memoized(obj1)).toBe(10); // same reference, cache hit
      expect(memoized(obj2)).toBe(10); // different reference, cache miss

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('multimemo', () => {
    it('should memoize function results', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoized = multimemo(fn);

      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cache multiple argument sets (up to 10)', () => {
      const fn = vi.fn((a: number) => a * 2);
      const memoized = multimemo(fn);

      // Call with 10 different arguments
      for (let i = 1; i <= 10; i++) {
        memoized(i);
      }
      expect(fn).toHaveBeenCalledTimes(10);

      // All 10 should still be cached
      for (let i = 1; i <= 10; i++) {
        memoized(i);
      }
      expect(fn).toHaveBeenCalledTimes(10); // no additional calls
    });

    it('should evict oldest entry when cache exceeds 10', () => {
      const fn = vi.fn((a: number) => a * 2);
      const memoized = multimemo(fn);

      // Fill cache with 10 entries
      for (let i = 1; i <= 10; i++) {
        memoized(i);
      }

      // Add 11th entry, should evict entry for arg 1
      memoized(11);
      expect(fn).toHaveBeenCalledTimes(11);

      // Arg 1 should be evicted, need to recompute
      memoized(1);
      expect(fn).toHaveBeenCalledTimes(12);
    });
  });
});
