import { describe, expect, it } from 'vitest';
import { OraclePrice, PercentageValue } from '@/shared/models/decimals';
import {
  createTestAssetPrice,
  createTestCandle,
  createTestMarketConfig,
} from '../test-fixtures/markets';

describe('Market Domain', () => {
  describe('MarketConfig', () => {
    it('should create valid market config', () => {
      const config = createTestMarketConfig();

      expect(config.id).toBeDefined();
      expect(config.asset).toBeDefined();
      expect(config.initialMarginFraction.toFloat()).toBeGreaterThan(0);
      expect(config.maintenanceMarginFraction.toFloat()).toBeLessThan(
        config.initialMarginFraction.toFloat()
      );
    });

    it('should allow custom values', () => {
      const config = createTestMarketConfig({
        initialMarginFraction: PercentageValue.fromFloat(0.1),
        maintenanceMarginFraction: PercentageValue.fromFloat(0.05),
      });

      expect(config.initialMarginFraction.toFloat()).toBeCloseTo(0.1, 4);
      expect(config.maintenanceMarginFraction.toFloat()).toBeCloseTo(0.05, 4);
    });
  });

  describe('AssetPrice', () => {
    it('should create valid asset price', () => {
      const price = createTestAssetPrice();

      expect(price.id).toBeDefined();
      expect(price.assetId).toBeDefined();
      expect(price.value.value).toBeGreaterThan(0n);
      expect(price.timestamp).toBeGreaterThan(0);
    });

    it('should handle different price values', () => {
      const price = createTestAssetPrice({
        value: OraclePrice.fromFloat(100000),
      });

      expect(price.value.toFloat()).toBeCloseTo(100000, 2);
    });
  });

  describe('Candle', () => {
    it('should create valid candle', () => {
      const candle = createTestCandle();

      expect(candle.id).toBeDefined();
      expect(candle.asset).toBeDefined();
      expect(candle.interval).toBeDefined();
      expect(candle.startedAt).toBeGreaterThan(0);
    });

    it('should have valid OHLC values', () => {
      const candle = createTestCandle({
        highPrice: 110n,
        lowPrice: 95n,
        closePrice: 105n,
      });

      expect(candle.highPrice).toBeGreaterThanOrEqual(candle.closePrice);
      expect(candle.lowPrice).toBeLessThanOrEqual(candle.closePrice);
    });

    it('should have price as bigint', () => {
      const candle = createTestCandle({
        closePrice: 50000n,
      });

      expect(typeof candle.closePrice).toBe('bigint');
      expect(candle.closePrice).toBeGreaterThan(0n);
    });
  });
});
