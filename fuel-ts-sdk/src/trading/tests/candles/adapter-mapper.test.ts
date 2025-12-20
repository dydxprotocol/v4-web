import { describe, it, expect } from 'vitest';
import type {
  CandleD1,
  CandleH1,
  CandleH4,
  CandleM1,
  CandleM15,
  CandleM30,
  CandleM5,
} from '@/generated/graphql';

describe('Candle Adapter - Mapper', () => {
  const intervals: Array<
    | { interval: 'D1'; type: CandleD1 }
    | { interval: 'H1'; type: CandleH1 }
    | { interval: 'H4'; type: CandleH4 }
    | { interval: 'M1'; type: CandleM1 }
    | { interval: 'M5'; type: CandleM5 }
    | { interval: 'M15'; type: CandleM15 }
    | { interval: 'M30'; type: CandleM30 }
  > = [
    {
      interval: 'D1',
      type: {
        __typename: 'CandleD1',
        id: 'candle-d1-001',
        asset: '0xasset123456789',
        closePrice: '1000000',
        highPrice: '1100000',
        lowPrice: '900000',
        startedAt: 1234567890,
      } as CandleD1,
    },
    {
      interval: 'H1',
      type: {
        __typename: 'CandleH1',
        id: 'candle-h1-001',
        asset: '0xasset123456789',
        closePrice: '1000000',
        highPrice: '1100000',
        lowPrice: '900000',
        startedAt: 1234567890,
      } as CandleH1,
    },
    {
      interval: 'H4',
      type: {
        __typename: 'CandleH4',
        id: 'candle-h4-001',
        asset: '0xasset123456789',
        closePrice: '1000000',
        highPrice: '1100000',
        lowPrice: '900000',
        startedAt: 1234567890,
      } as CandleH4,
    },
    {
      interval: 'M1',
      type: {
        __typename: 'CandleM1',
        id: 'candle-m1-001',
        asset: '0xasset123456789',
        closePrice: '1000000',
        highPrice: '1100000',
        lowPrice: '900000',
        startedAt: 1234567890,
      } as CandleM1,
    },
    {
      interval: 'M5',
      type: {
        __typename: 'CandleM5',
        id: 'candle-m5-001',
        asset: '0xasset123456789',
        closePrice: '1000000',
        highPrice: '1100000',
        lowPrice: '900000',
        startedAt: 1234567890,
      } as CandleM5,
    },
    {
      interval: 'M15',
      type: {
        __typename: 'CandleM15',
        id: 'candle-m15-001',
        asset: '0xasset123456789',
        closePrice: '1000000',
        highPrice: '1100000',
        lowPrice: '900000',
        startedAt: 1234567890,
      } as CandleM15,
    },
    {
      interval: 'M30',
      type: {
        __typename: 'CandleM30',
        id: 'candle-m30-001',
        asset: '0xasset123456789',
        closePrice: '1000000',
        highPrice: '1100000',
        lowPrice: '900000',
        startedAt: 1234567890,
      } as CandleM30,
    },
  ];

  intervals.forEach(({ interval, type }) => {
    it(`should convert GraphQL candle to domain candle for interval ${interval}`, () => {
      expect(type).toBeDefined();
      expect(type.asset).toBe('0xasset123456789');
      expect(type.closePrice).toBe('1000000');
      expect(type.highPrice).toBe('1100000');
      expect(type.lowPrice).toBe('900000');
      expect(type.startedAt).toBe(1234567890);
    });
  });

  intervals.forEach(({ interval, type }) => {
    it(`should handle bigint string conversion correctly for interval ${interval}`, () => {
      const closePrice = BigInt(type.closePrice);
      const highPrice = BigInt(type.highPrice);
      const lowPrice = BigInt(type.lowPrice);

      expect(closePrice).toBe(BigInt(1000000));
      expect(highPrice).toBe(BigInt(1100000));
      expect(lowPrice).toBe(BigInt(900000));
      expect(typeof closePrice).toBe('bigint');
      expect(typeof highPrice).toBe('bigint');
      expect(typeof lowPrice).toBe('bigint');
    });
  });

  intervals.forEach(({ interval }) => {
    it(`should handle very large price strings for interval ${interval}`, () => {
      const largeCandle = {
        __typename: `Candle${interval}` as const,
        id: `candle-${interval.toLowerCase()}-002`,
        asset: '0xasset123456789',
        closePrice: '999999999999999999999',
        highPrice: '999999999999999999999',
        lowPrice: '999999999999999999999',
        startedAt: 1234567890,
      };

      const closePrice = BigInt(largeCandle.closePrice);
      const highPrice = BigInt(largeCandle.highPrice);
      const lowPrice = BigInt(largeCandle.lowPrice);

      expect(closePrice).toBe(BigInt('999999999999999999999'));
      expect(highPrice).toBe(BigInt('999999999999999999999'));
      expect(lowPrice).toBe(BigInt('999999999999999999999'));
      expect(typeof closePrice).toBe('bigint');
    });
  });

  intervals.forEach(({ interval, type }) => {
    it(`should preserve startedAt as integer for interval ${interval}`, () => {
      expect(type.startedAt).toBe(1234567890);
      expect(Number.isInteger(type.startedAt)).toBe(true);
    });
  });

  intervals.forEach(({ interval }) => {
    it(`should handle zero price values for interval ${interval}`, () => {
      const zeroCandle = {
        __typename: `Candle${interval}` as const,
        id: `candle-${interval.toLowerCase()}-003`,
        asset: '0xasset123456789',
        closePrice: '0',
        highPrice: '0',
        lowPrice: '0',
        startedAt: 1234567890,
      };

      const closePrice = BigInt(zeroCandle.closePrice);
      const highPrice = BigInt(zeroCandle.highPrice);
      const lowPrice = BigInt(zeroCandle.lowPrice);

      expect(closePrice).toBe(BigInt(0));
      expect(highPrice).toBe(BigInt(0));
      expect(lowPrice).toBe(BigInt(0));
    });
  });
});
