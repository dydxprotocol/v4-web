import { describe, it, expect } from 'vitest';
import { Price, PriceSchema } from '../../src/prices';
import { assetId, priceId } from '@/shared/types';

describe('Price Domain', () => {
  describe('PriceSchema', () => {
    it('should validate a valid price', () => {
      const validPrice = {
        id: priceId('price-123'),
        asset: assetId('0xasset123'),
        price: BigInt(1000000),
        timestamp: 1234567890,
      };

      const result = PriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('price-123');
        expect(result.data.asset).toBe('0xasset123');
        expect(result.data.price).toBe(BigInt(1000000));
        expect(result.data.timestamp).toBe(1234567890);
      }
    });

    it('should reject empty price ID', () => {
      const invalidPrice = {
        id: '',
        asset: assetId('0xasset123'),
        price: BigInt(1000000),
        timestamp: 1234567890,
      };

      expect(() => PriceSchema.parse(invalidPrice)).toThrow();
    });

    it('should reject empty asset ID', () => {
      const invalidPrice = {
        id: priceId('price-123'),
        asset: '',
        price: BigInt(1000000),
        timestamp: 1234567890,
      };

      expect(() => PriceSchema.parse(invalidPrice)).toThrow();
    });

    it('should reject non-bigint price', () => {
      const invalidPrice = {
        id: priceId('price-123'),
        asset: assetId('0xasset123'),
        price: 1000000, // number instead of bigint
        timestamp: 1234567890,
      };

      expect(() => PriceSchema.parse(invalidPrice)).toThrow();
    });

    it('should reject non-integer timestamp', () => {
      const invalidPrice = {
        id: priceId('price-123'),
        asset: assetId('0xasset123'),
        price: BigInt(1000000),
        timestamp: 1234567890.5, // float instead of int
      };

      expect(() => PriceSchema.parse(invalidPrice)).toThrow();
    });

    it('should accept zero price', () => {
      const validPrice = {
        id: priceId('price-123'),
        asset: assetId('0xasset123'),
        price: BigInt(0),
        timestamp: 1234567890,
      };

      const result = PriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(BigInt(0));
      }
    });

    it('should accept very large price values', () => {
      const validPrice = {
        id: priceId('price-123'),
        asset: assetId('0xasset123'),
        price: BigInt('999999999999999999999'),
        timestamp: 1234567890,
      };

      const result = PriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(BigInt('999999999999999999999'));
      }
    });

    it('should accept negative timestamp (if needed for historical data)', () => {
      const validPrice = {
        id: priceId('price-123'),
        asset: assetId('0xasset123'),
        price: BigInt(1000000),
        timestamp: -1234567890,
      };

      const result = PriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timestamp).toBe(-1234567890);
      }
    });
  });
});
