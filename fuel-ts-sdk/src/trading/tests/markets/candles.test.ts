import { describe, expect, it } from 'vitest';
import { createCandleSeries, createTestCandle } from '../test-fixtures/markets';

describe('Candles', () => {
  describe('Candle entity', () => {
    it('should create a valid candle', () => {
      const candle = createTestCandle();

      expect(candle.id).toBeDefined();
      expect(candle.asset).toBeDefined();
      expect(candle.interval).toBe('M15');
      expect(candle.startedAt).toBeGreaterThan(0);
      expect(candle.closePrice).toBeGreaterThan(0n);
      expect(candle.highPrice).toBeGreaterThan(0n);
      expect(candle.lowPrice).toBeGreaterThan(0n);
    });

    it('should have high >= low', () => {
      const candle = createTestCandle({
        highPrice: 52000n,
        lowPrice: 48000n,
        closePrice: 50000n,
      });

      expect(candle.highPrice).toBeGreaterThanOrEqual(candle.lowPrice);
    });

    it('should have close price within range', () => {
      const candle = createTestCandle({
        highPrice: 52000n,
        lowPrice: 48000n,
        closePrice: 50000n,
      });

      expect(candle.closePrice).toBeGreaterThanOrEqual(candle.lowPrice);
      expect(candle.closePrice).toBeLessThanOrEqual(candle.highPrice);
    });

    it('should support different intervals', () => {
      const intervals = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'] as const;

      intervals.forEach((interval) => {
        const candle = createTestCandle({ interval });
        expect(candle.interval).toBe(interval);
      });
    });
  });

  describe('Candle series', () => {
    it('should create multiple candles', () => {
      const series = createCandleSeries(10);

      expect(series).toHaveLength(10);
    });

    it('should have sequential timestamps', () => {
      const series = createCandleSeries(5);

      for (let i = 1; i < series.length; i++) {
        expect(series[i].startedAt).toBeGreaterThan(series[i - 1].startedAt);
      }
    });

    it('should have unique IDs', () => {
      const series = createCandleSeries(5);
      const ids = series.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(series.length);
    });

    it('should create empty array for zero count', () => {
      const series = createCandleSeries(0);

      expect(series).toHaveLength(0);
    });
  });

  describe('OHLC data integrity', () => {
    it('should maintain valid OHLC relationships', () => {
      const candles = createCandleSeries(20);

      candles.forEach((candle) => {
        expect(candle.highPrice).toBeGreaterThanOrEqual(candle.closePrice);
        expect(candle.lowPrice).toBeLessThanOrEqual(candle.closePrice);
        expect(candle.highPrice).toBeGreaterThanOrEqual(candle.lowPrice);
      });
    });

    it('should have all prices as bigint', () => {
      const candle = createTestCandle();

      expect(typeof candle.highPrice).toBe('bigint');
      expect(typeof candle.lowPrice).toBe('bigint');
      expect(typeof candle.closePrice).toBe('bigint');
    });
  });
});
