import { $decimalValue } from '@sdk/shared/models/DecimalValue';
import { OraclePrice } from '@sdk/shared/models/decimals';
import { assetId } from '@sdk/shared/types';
import { describe, expect, it } from 'vitest';
import { createTestAssetPrice } from '../test-fixtures/markets';

describe('Asset Prices', () => {
  describe('AssetPrice entity', () => {
    it('should create a valid asset price', () => {
      const price = createTestAssetPrice();

      expect(price.id).toBeDefined();
      expect(price.assetId).toBeDefined();
      expect(price.value).toHaveProperty('value');
      expect(price.value).toHaveProperty('decimals', OraclePrice.decimals);
      expect(BigInt(price.value.value)).toBeGreaterThan(0n);
      expect(price.timestamp).toBeGreaterThan(0);
    });

    it('should support custom price values', () => {
      const customPrice = OraclePrice.fromFloat(75000);
      const price = createTestAssetPrice({
        value: customPrice,
      });

      expect($decimalValue(price.value).toFloat()).toBeCloseTo(75000, 2);
    });

    it('should support different assets', () => {
      const btcPrice = createTestAssetPrice({
        assetId: assetId('0xbtc'),
      });
      const ethPrice = createTestAssetPrice({
        assetId: assetId('0xeth'),
      });

      expect(btcPrice.assetId).not.toBe(ethPrice.assetId);
    });

    it('should handle zero price', () => {
      const price = createTestAssetPrice({
        value: OraclePrice.fromFloat(0),
      });

      expect($decimalValue(price.value).toFloat()).toBe(0);
    });

    it('should have timestamp in milliseconds', () => {
      const price = createTestAssetPrice();
      const now = Date.now();

      // Timestamp should be recent (within last second)
      expect(price.timestamp).toBeLessThanOrEqual(now);
      expect(price.timestamp).toBeGreaterThan(now - 1000);
    });
  });

  describe('Price updates', () => {
    it('should create prices with different timestamps', () => {
      const price1 = createTestAssetPrice({ timestamp: 1000 });
      const price2 = createTestAssetPrice({ timestamp: 2000 });

      expect(price2.timestamp).toBeGreaterThan(price1.timestamp);
    });

    it('should support price history', () => {
      const timestamps = [1000, 2000, 3000, 4000];
      const prices = timestamps.map((timestamp) =>
        createTestAssetPrice({
          timestamp,
          value: OraclePrice.fromFloat(50000 + timestamp),
        })
      );

      expect(prices).toHaveLength(4);
      expect($decimalValue(prices[3].value).toFloat()).toBeGreaterThan(
        $decimalValue(prices[0].value).toFloat()
      );
    });
  });

  describe('Price precision', () => {
    it('should handle high precision prices', () => {
      const price = createTestAssetPrice({
        value: OraclePrice.fromFloat(50123.456789),
      });

      expect($decimalValue(price.value).toFloat()).toBeCloseTo(50123.456789, 6);
    });

    it('should handle very large prices', () => {
      const price = createTestAssetPrice({
        value: OraclePrice.fromFloat(1000000),
      });

      expect($decimalValue(price.value).toFloat()).toBeCloseTo(1000000, 2);
    });

    it('should handle very small prices', () => {
      const price = createTestAssetPrice({
        value: OraclePrice.fromFloat(0.0001),
      });

      expect($decimalValue(price.value).toFloat()).toBeCloseTo(0.0001, 6);
    });
  });
});
