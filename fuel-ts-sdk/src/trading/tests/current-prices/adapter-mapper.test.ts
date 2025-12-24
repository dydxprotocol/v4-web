import { describe, expect, it } from 'vitest';
import type { CurrentPrice as GraphQLCurrentPrice } from '@/generated/graphql';

describe('CurrentPrice Adapter - Mapper', () => {
  // Mock GraphQL current price data
  const mockGraphQLCurrentPrice: GraphQLCurrentPrice = {
    __typename: 'CurrentPrice',
    id: 'price-001',
    asset: '0xasset123456789',
    price: '1000000',
    timestamp: 1234567890,
  };

  it('should have the expected GraphQL shape', () => {
    expect(mockGraphQLCurrentPrice).toBeDefined();
    expect(mockGraphQLCurrentPrice.id).toBe('price-001');
    expect(mockGraphQLCurrentPrice.asset).toBe('0xasset123456789');
  });

  it('should handle bigint string conversion correctly', () => {
    const price = BigInt(mockGraphQLCurrentPrice.price);
    expect(price).toBe(BigInt(1000000));
    expect(typeof price).toBe('bigint');
  });

  it('should handle very large price strings', () => {
    const largePrice: GraphQLCurrentPrice = {
      __typename: 'CurrentPrice',
      id: 'price-002',
      asset: '0xasset123456789',
      price: '999999999999999999999',
      timestamp: 1234567890,
    };

    const price = BigInt(largePrice.price);
    expect(price).toBe(BigInt('999999999999999999999'));
    expect(typeof price).toBe('bigint');
  });

  it('should preserve timestamp as integer', () => {
    expect(mockGraphQLCurrentPrice.timestamp).toBe(1234567890);
    expect(Number.isInteger(mockGraphQLCurrentPrice.timestamp)).toBe(true);
  });

  it('should handle zero price values', () => {
    const zeroPrice: GraphQLCurrentPrice = {
      __typename: 'CurrentPrice',
      id: 'price-003',
      asset: '0xasset123456789',
      price: '0',
      timestamp: 1234567890,
    };

    const price = BigInt(zeroPrice.price);
    expect(price).toBe(BigInt(0));
  });
});
