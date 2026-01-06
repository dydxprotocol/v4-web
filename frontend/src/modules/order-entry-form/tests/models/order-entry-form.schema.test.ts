import { describe, expect, it } from 'vitest';
import { createOrderEntryFormSchema } from '../../src/models/order-entry-form.schema';

const mockContext = {
  baseAssetName: 'BTC',
  quoteAssetName: 'USD',
  userBalanceInQuoteAsset: 100000,
  userBalanceInBaseAsset: 10,
  currentQuoteAssetPrice: 50000,
};

describe('orderEntryFormSchema', () => {
  const schema = createOrderEntryFormSchema(mockContext);

  describe('orderMode validation', () => {
    it('accepts regular mode', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('accepts stops mode', () => {
      const result = schema.safeParse({
        orderMode: 'stops',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '50001',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid mode', () => {
      const result = schema.safeParse({
        orderMode: 'invalid',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('orderExecutionType validation', () => {
    it('accepts market execution', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('accepts limit execution', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'limit',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid execution type', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'invalid',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('orderSide validation', () => {
    it('accepts buy side', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('accepts sell side', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'sell',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid side', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'invalid',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('positionSize validation', () => {
    it('accepts positive numbers', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1.5',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty position size', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });

    it('rejects zero position size', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '0',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });

    it('rejects negative position size', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '-1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('price validation for limit orders', () => {
    it('requires price for limit orders', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'limit',
        orderSide: 'buy',
        positionSize: '1',
        price: '',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });

    it('accepts valid price for limit orders', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'limit',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('allows empty price for market orders', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects zero price for limit orders', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'limit',
        orderSide: 'buy',
        positionSize: '1',
        price: '0',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });

    it('rejects negative price for limit orders', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'limit',
        orderSide: 'buy',
        positionSize: '1',
        price: '-100',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('triggerPrice validation for stop orders', () => {
    it('requires trigger price for stop orders', () => {
      const result = schema.safeParse({
        orderMode: 'stops',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(false);
    });

    it('accepts valid trigger price for stop orders', () => {
      const result = schema.safeParse({
        orderMode: 'stops',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '50001',
      });

      expect(result.success).toBe(true);
    });

    it('allows empty trigger price for regular orders', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects zero trigger price for stop orders', () => {
      const result = schema.safeParse({
        orderMode: 'stops',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1',
        price: '50000',
        triggerPrice: '0',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('complete form validation', () => {
    it('validates a complete regular market order', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '1.5',
        price: '50000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('validates a complete regular limit order', () => {
      const result = schema.safeParse({
        orderMode: 'regular',
        orderExecutionType: 'limit',
        orderSide: 'sell',
        positionSize: '2.0',
        price: '48000',
        triggerPrice: '',
      });

      expect(result.success).toBe(true);
    });

    it('validates a complete stop market order', () => {
      const result = schema.safeParse({
        orderMode: 'stops',
        orderExecutionType: 'market',
        orderSide: 'buy',
        positionSize: '0.5',
        price: '50000',
        triggerPrice: '52000',
      });

      expect(result.success).toBe(true);
    });

    it('validates a complete stop limit order', () => {
      const result = schema.safeParse({
        orderMode: 'stops',
        orderExecutionType: 'limit',
        orderSide: 'sell',
        positionSize: '1.0',
        price: '47000',
        triggerPrice: '48000',
      });

      expect(result.success).toBe(true);
    });
  });
});
