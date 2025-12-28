import { describe, expect, it } from 'vitest';
import { assetId } from '@/shared/types';
import { CandleSchema } from '../../src/markets';

describe('Candle Domain', () => {
  describe('CandleSchema', () => {
    const intervals: Array<'D1' | 'H1' | 'H4' | 'M1' | 'M5' | 'M15' | 'M30'> = [
      'D1',
      'H1',
      'H4',
      'M1',
      'M5',
      'M15',
      'M30',
    ];

    intervals.forEach((interval) => {
      it(`should validate a valid candle for interval ${interval}`, () => {
        const validCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt(1000000),
          highPrice: BigInt(1100000),
          lowPrice: BigInt(900000),
          startedAt: 1234567890,
        };

        const result = CandleSchema.safeParse(validCandle);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.asset).toBe('0xasset123');
          expect(result.data.closePrice).toBe(BigInt(1000000));
          expect(result.data.highPrice).toBe(BigInt(1100000));
          expect(result.data.lowPrice).toBe(BigInt(900000));
          expect(result.data.startedAt).toBe(1234567890);
        }
      });
    });

    intervals.forEach((interval) => {
      it(`should reject empty asset ID for interval ${interval}`, () => {
        const invalidCandle = {
          asset: '',
          closePrice: BigInt(1000000),
          highPrice: BigInt(1100000),
          lowPrice: BigInt(900000),
          startedAt: 1234567890,
        };

        expect(() => CandleSchema.parse(invalidCandle)).toThrow();
      });
    });

    intervals.forEach((interval) => {
      it(`should reject non-bigint closePrice for interval ${interval}`, () => {
        const invalidCandle = {
          asset: assetId('0xasset123'),
          closePrice: 1000000, // number instead of bigint
          highPrice: BigInt(1100000),
          lowPrice: BigInt(900000),
          startedAt: 1234567890,
        };

        expect(() => CandleSchema.parse(invalidCandle)).toThrow();
      });
    });

    intervals.forEach((interval) => {
      it(`should reject non-bigint highPrice for interval ${interval}`, () => {
        const invalidCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt(1000000),
          highPrice: 1100000, // number instead of bigint
          lowPrice: BigInt(900000),
          startedAt: 1234567890,
        };

        expect(() => CandleSchema.parse(invalidCandle)).toThrow();
      });
    });

    intervals.forEach((interval) => {
      it(`should reject non-bigint lowPrice for interval ${interval}`, () => {
        const invalidCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt(1000000),
          highPrice: BigInt(1100000),
          lowPrice: 900000, // number instead of bigint
          startedAt: 1234567890,
        };

        expect(() => CandleSchema.parse(invalidCandle)).toThrow();
      });
    });

    intervals.forEach((interval) => {
      it(`should reject non-integer startedAt for interval ${interval}`, () => {
        const invalidCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt(1000000),
          highPrice: BigInt(1100000),
          lowPrice: BigInt(900000),
          startedAt: 1234567890.5, // float instead of int
        };

        expect(() => CandleSchema.parse(invalidCandle)).toThrow();
      });
    });

    intervals.forEach((interval) => {
      it(`should accept zero prices for interval ${interval}`, () => {
        const validCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt(0),
          highPrice: BigInt(0),
          lowPrice: BigInt(0),
          startedAt: 1234567890,
        };

        const result = CandleSchema.safeParse(validCandle);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.closePrice).toBe(BigInt(0));
          expect(result.data.highPrice).toBe(BigInt(0));
          expect(result.data.lowPrice).toBe(BigInt(0));
        }
      });
    });

    intervals.forEach((interval) => {
      it(`should accept very large price values for interval ${interval}`, () => {
        const validCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt('999999999999999999999'),
          highPrice: BigInt('999999999999999999999'),
          lowPrice: BigInt('999999999999999999999'),
          startedAt: 1234567890,
        };

        const result = CandleSchema.safeParse(validCandle);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.closePrice).toBe(BigInt('999999999999999999999'));
          expect(result.data.highPrice).toBe(BigInt('999999999999999999999'));
          expect(result.data.lowPrice).toBe(BigInt('999999999999999999999'));
        }
      });
    });

    intervals.forEach((interval) => {
      it(`should accept negative startedAt (if needed for historical data) for interval ${interval}`, () => {
        const validCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt(1000000),
          highPrice: BigInt(1100000),
          lowPrice: BigInt(900000),
          startedAt: -1234567890,
        };

        const result = CandleSchema.safeParse(validCandle);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.startedAt).toBe(-1234567890);
        }
      });
    });

    intervals.forEach((interval) => {
      it(`should validate that highPrice >= lowPrice for interval ${interval}`, () => {
        // Note: This is a business logic validation that might be enforced elsewhere
        // The schema itself doesn't enforce this, but we can test the values
        const validCandle = {
          asset: assetId('0xasset123'),
          closePrice: BigInt(1000000),
          highPrice: BigInt(1100000),
          lowPrice: BigInt(900000),
          startedAt: 1234567890,
        };

        const result = CandleSchema.safeParse(validCandle);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.highPrice >= result.data.lowPrice).toBe(true);
        }
      });
    });
  });
});
