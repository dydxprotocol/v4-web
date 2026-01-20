import { describe, expect, it } from 'vitest';
import './pipe';

describe('pipe', () => {
  describe('Array.prototype.pipe', () => {
    it('applies transformation function to array', () => {
      const result = [1, 2, 3].pipe((arr) => arr.map((x) => x * 2));
      expect(result).toEqual([2, 4, 6]);
    });

    it('chains multiple transformations', () => {
      const result = [1, 2, 3]
        .pipe((arr) => arr.map((x) => x * 2))
        .pipe((arr) => arr.filter((x) => x > 2))
        .pipe((arr) => arr.reduce((a, b) => a + b, 0));

      expect(result).toBe(10); // 4 + 6 = 10
    });

    it('works with empty arrays', () => {
      const result = ([] as number[]).pipe((arr) => arr.length);
      expect(result).toBe(0);
    });

    it('can transform to different types', () => {
      const result = ['a', 'b', 'c'].pipe((arr) => arr.join('-'));
      expect(result).toBe('a-b-c');
    });
  });

  describe('String.prototype.pipe', () => {
    it('applies transformation function to string', () => {
      const result = 'hello'.pipe((s) => s.toUpperCase());
      expect(result).toBe('HELLO');
    });

    it('chains multiple transformations', () => {
      const result = 'hello'
        .pipe((s) => s.toUpperCase())
        .pipe((s) => s.split(''))
        .pipe((arr) => arr.length);

      expect(result).toBe(5);
    });

    it('works with empty strings', () => {
      const result = ''.pipe((s) => s.length);
      expect(result).toBe(0);
    });
  });

  describe('Number.prototype.pipe', () => {
    it('applies transformation function to number', () => {
      const result = (42).pipe((n) => n * 2);
      expect(result).toBe(84);
    });

    it('chains multiple transformations', () => {
      const result = (42)
        .pipe((n) => n * 2)
        .pipe((n) => n.toString())
        .pipe((s) => s.length);

      expect(result).toBe(2);
    });

    it('works with zero', () => {
      const result = (0).pipe((n) => n + 1);
      expect(result).toBe(1);
    });

    it('works with negative numbers', () => {
      const result = (-5).pipe((n) => Math.abs(n));
      expect(result).toBe(5);
    });
  });

  describe('Boolean.prototype.pipe', () => {
    it('applies transformation function to boolean', () => {
      const result = true.pipe((b) => !b);
      expect(result).toBe(false);
    });

    it('chains multiple transformations', () => {
      const result = true.pipe((b) => !b).pipe((b) => (b ? 'yes' : 'no'));

      expect(result).toBe('no');
    });
  });

  describe('Object.prototype.pipe', () => {
    it('applies transformation function to object', () => {
      const obj = { x: 1, y: 2 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = obj.pipe((o: any) => o.x + o.y);
      expect(result).toBe(3);
    });

    it('chains multiple transformations', () => {
      const obj = { x: 1, y: 2 };
      const result = obj
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .pipe((o: any) => o.x + o.y)
        .pipe((sum: number) => sum * 2);

      expect(result).toBe(6);
    });

    it('works with nested objects', () => {
      const obj = { data: { value: 42 } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = obj.pipe((o: any) => o.data.value);
      expect(result).toBe(42);
    });
  });
});
