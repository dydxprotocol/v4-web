import { describe, expect, it } from 'vitest';
import { assetId } from '@/shared/types';
import { CurrentPrice, CurrentPriceSchema } from '../../src/markets';

describe('CurrentPrice Domain', () => {
  describe('CurrentPriceSchema', () => {
    it('should validate a valid current price', () => {
      const validPrice: CurrentPrice = {
        asset: assetId('0xasset123'),
        price: BigInt(1000000),
        timestamp: 1234567890,
      };

      const result = CurrentPriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.asset).toBe('0xasset123');
        expect(result.data.price).toBe(BigInt(1000000));
        expect(result.data.timestamp).toBe(1234567890);
      }
    });

    it('should reject empty asset ID', () => {
      const invalidPrice = {
        asset: '',
        price: BigInt(1000000),
        timestamp: 1234567890,
      };

      expect(() => CurrentPriceSchema.parse(invalidPrice)).toThrow();
    });

    it('should reject non-bigint price', () => {
      const invalidPrice = {
        asset: assetId('0xasset123'),
        // @ts-expect-error - testing invalid type
        price: 1000000,
        timestamp: 1234567890,
      };

      expect(() => CurrentPriceSchema.parse(invalidPrice)).toThrow();
    });

    it('should reject non-integer timestamp', () => {
      const invalidPrice = {
        asset: assetId('0xasset123'),
        price: BigInt(1000000),
        timestamp: 1234567890.5, // float instead of int
      };

      expect(() => CurrentPriceSchema.parse(invalidPrice)).toThrow();
    });

    it('should accept zero price', () => {
      const validPrice: CurrentPrice = {
        asset: assetId('0xasset123'),
        price: BigInt(0),
        timestamp: 1234567890,
      };

      const result = CurrentPriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(BigInt(0));
      }
    });

    it('should accept very large price values', () => {
      const validPrice: CurrentPrice = {
        asset: assetId('0xasset123'),
        price: BigInt('999999999999999999999'),
        timestamp: 1234567890,
      };

      const result = CurrentPriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(BigInt('999999999999999999999'));
      }
    });

    it('should accept negative timestamp (if needed for historical data)', () => {
      const validPrice: CurrentPrice = {
        asset: assetId('0xasset123'),
        price: BigInt(1000000),
        timestamp: -1234567890,
      };

      const result = CurrentPriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timestamp).toBe(-1234567890);
      }
    });
  });
});
