import { signal } from '@preact/signals-react';
import { describe, expect, it } from 'vitest';
import { createOrderEntryFormSchema } from '../../src/models/order-entry-form.schema';

const mockContext = {
  quoteAssetName: 'BTC',
  userBalanceInBaseAsset: 10000,
  currentQuoteAssetPrice: signal(50000),
  currentBaseAssetPrice: signal(1),
  maxLeverage: 100,
  minCollateral: 10,
  minPositionSize: 0.001,
  warnHighLeverage: true,
  initialMarginFraction: 0.01,
  maintenanceMarginFraction: 0.005,
};

describe('orderEntryFormSchema', () => {
  const schema = createOrderEntryFormSchema(mockContext);

  describe('orderSide validation', () => {
    it('accepts long side', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('accepts short side', () => {
      const result = schema.safeParse({
        orderSide: 'short',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid side', () => {
      const result = schema.safeParse({
        orderSide: 'invalid',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('leverage validation', () => {
    it('accepts valid leverage within range', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('accepts minimum leverage (0.1x)', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '500',
        collateralSize: '5000',
        leverage: '0.1',
      });

      expect(result.success).toBe(true);
    });

    it('accepts maximum leverage (100x)', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '500000',
        collateralSize: '5000',
        leverage: '100',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty leverage', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '',
      });

      expect(result.success).toBe(false);
    });

    it('rejects leverage below minimum', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '0.05',
      });

      expect(result.success).toBe(false);
    });

    it('rejects leverage above maximum', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '150',
      });

      expect(result.success).toBe(false);
    });

    it('rejects leverage exceeding initial margin fraction limit', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '550000',
        collateralSize: '5000',
        leverage: '110',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('collateralSize validation', () => {
    it('accepts valid collateral', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty collateral', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });

    it('rejects zero collateral', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '0',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });

    it('rejects collateral exceeding user balance', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '550000',
        collateralSize: '11000',
        leverage: '50',
      });

      expect(result.success).toBe(false);
    });

    it('rejects collateral below minimum', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50',
        collateralSize: '5',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('positionSize validation', () => {
    it('accepts valid position size', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty position size', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });

    it('rejects zero position size', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '0',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });

    it('rejects negative position size', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '-1000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });

    it('rejects position size below minimum', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '0.0005',
        collateralSize: '100',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('margin sufficiency validation', () => {
    it('accepts position with sufficient collateral', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('rejects position with insufficient collateral', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '100000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });

    it('validates position size matches leverage relationship', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '100000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('complete form validation', () => {
    it('validates a complete long market order', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '50000',
        collateralSize: '5000',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('validates a complete short market order', () => {
      const result = schema.safeParse({
        orderSide: 'short',
        positionSize: '48000',
        collateralSize: '4800',
        leverage: '10',
      });

      expect(result.success).toBe(true);
    });

    it('validates high leverage position', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '500000',
        collateralSize: '5000',
        leverage: '100',
      });

      expect(result.success).toBe(true);
    });

    it('validates low leverage position', () => {
      const result = schema.safeParse({
        orderSide: 'long',
        positionSize: '500',
        collateralSize: '5000',
        leverage: '0.1',
      });

      expect(result.success).toBe(true);
    });

    it('validates typical 5x leverage position', () => {
      const result = schema.safeParse({
        orderSide: 'short',
        positionSize: '25000',
        collateralSize: '5000',
        leverage: '5',
      });

      expect(result.success).toBe(true);
    });
  });
});
