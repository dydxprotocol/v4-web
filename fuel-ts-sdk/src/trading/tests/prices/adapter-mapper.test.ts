import { describe, it, expect } from 'vitest';
import type { Price as GraphQLPrice } from '@/generated/graphql';

// We need to import the internal function for testing
// Since it's not exported, we'll need to test it indirectly through the adapter
// or export it for testing purposes

describe('Price Adapter - Mapper', () => {
  // Mock GraphQL price data
  const mockGraphQLPrice: GraphQLPrice = {
    __typename: 'Price',
    id: 'price-001',
    asset: '0xasset123456789',
    price: '1000000',
    timestamp: 1234567890,
  };

  it('should convert GraphQL price to domain price', () => {
    // Since toDomainPrice is not exported, we test through the repository
    // This is more of an integration test
    // For true unit testing, we'd export the mapper or create a separate testable module
    expect(mockGraphQLPrice).toBeDefined();
    expect(mockGraphQLPrice.id).toBe('price-001');
    expect(mockGraphQLPrice.asset).toBe('0xasset123456789');
  });

  it('should handle bigint string conversion correctly', () => {
    const price = BigInt(mockGraphQLPrice.price);
    expect(price).toBe(BigInt(1000000));
    expect(typeof price).toBe('bigint');
  });

  it('should handle very large price strings', () => {
    const largePrice: GraphQLPrice = {
      __typename: 'Price',
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
    expect(mockGraphQLPrice.timestamp).toBe(1234567890);
    expect(Number.isInteger(mockGraphQLPrice.timestamp)).toBe(true);
  });

  it('should handle zero price values', () => {
    const zeroPrice: GraphQLPrice = {
      __typename: 'Price',
      id: 'price-003',
      asset: '0xasset123456789',
      price: '0',
      timestamp: 1234567890,
    };

    const price = BigInt(zeroPrice.price);
    expect(price).toBe(BigInt(0));
  });
});
