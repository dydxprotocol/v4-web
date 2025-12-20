import type { Price as GraphQLPrice } from '@/generated/graphql';
import type { GraphQLClient } from 'graphql-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createGraphQLPriceRepository } from '../../src/prices';

describe('Price Repository Adapter', () => {
  let mockClient: GraphQLClient;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    mockClient = {
      request: mockRequest,
    } as unknown as GraphQLClient;
  });

  const mockGraphQLPrices: GraphQLPrice[] = [
    {
      __typename: 'Price',
      id: 'price-001',
      asset: '0xasset123',
      price: '1000000',
      timestamp: 1234567890,
    },
    {
      __typename: 'Price',
      id: 'price-002',
      asset: '0xasset456',
      price: '2000000',
      timestamp: 1234567900,
    },
    {
      __typename: 'Price',
      id: 'price-003',
      asset: '0xasset123',
      price: '1500000',
      timestamp: 1234567910,
    },
  ];

  describe('getPrices', () => {
    it('should fetch prices with default options', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: mockGraphQLPrices } });

      const repository = createGraphQLPriceRepository(mockClient);
      const prices = await repository.getPrices();

      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(prices).toHaveLength(3);
      expect(prices[0]?.id).toBe('price-001');
      expect(prices[0]?.price).toBe(BigInt(1000000));
      expect(prices[0]?.asset).toBe('0xasset123');
    });

    it('should apply limit and offset options', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: [mockGraphQLPrices[0]] } });

      const repository = createGraphQLPriceRepository(mockClient);
      await repository.getPrices({ limit: 10, offset: 5 });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          limit: 10,
          offset: 5,
        })
      );
    });

    it('should use default limit and offset when not provided', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: mockGraphQLPrices } });

      const repository = createGraphQLPriceRepository(mockClient);
      await repository.getPrices();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          limit: 100,
          offset: 0,
        })
      );
    });

    it('should filter by asset', async () => {
      mockRequest.mockResolvedValue({
        prices: { nodes: [mockGraphQLPrices[0], mockGraphQLPrices[2]] },
      });

      const repository = createGraphQLPriceRepository(mockClient);

      await repository.getPrices({ asset: '0xasset123' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            asset_eq: '0xasset123',
          }),
        })
      );
    });

    it('should apply default orderBy as TIMESTAMP_DESC', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: mockGraphQLPrices } });

      const repository = createGraphQLPriceRepository(mockClient);

      await repository.getPrices();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderBy: ['TIMESTAMP_DESC'],
        })
      );
    });

    it('should apply custom orderBy', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: mockGraphQLPrices } });

      const repository = createGraphQLPriceRepository(mockClient);

      await repository.getPrices({ orderBy: 'TIMESTAMP_ASC' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderBy: ['TIMESTAMP_ASC'],
        })
      );
    });

    it('should combine multiple options', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: [mockGraphQLPrices[0]] } });

      const repository = createGraphQLPriceRepository(mockClient);

      await repository.getPrices({
        asset: '0xasset123',
        limit: 5,
        offset: 10,
        orderBy: 'TIMESTAMP_ASC',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          limit: 5,
          offset: 10,
          where: expect.objectContaining({
            asset_eq: '0xasset123',
          }),
          orderBy: ['TIMESTAMP_ASC'],
        })
      );
    });

    it('should not include where clause when no filters provided', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: mockGraphQLPrices } });

      const repository = createGraphQLPriceRepository(mockClient);

      await repository.getPrices({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: undefined,
        })
      );
    });

    it('should convert GraphQL prices to domain prices correctly', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: [mockGraphQLPrices[0]] } });

      const repository = createGraphQLPriceRepository(mockClient);
      const prices = await repository.getPrices();

      expect(prices).toHaveLength(1);
      expect(prices[0]?.id).toBe('price-001');
      expect(prices[0]?.asset).toBe('0xasset123');
      expect(prices[0]?.price).toBe(BigInt(1000000));
      expect(prices[0]?.timestamp).toBe(1234567890);
      expect(typeof prices[0]?.price).toBe('bigint');
      expect(Number.isInteger(prices[0]?.timestamp)).toBe(true);
    });

    it('should handle empty results', async () => {
      mockRequest.mockResolvedValue({ prices: { nodes: [] } });

      const repository = createGraphQLPriceRepository(mockClient);
      const prices = await repository.getPrices();

      expect(prices).toHaveLength(0);
      expect(Array.isArray(prices)).toBe(true);
    });
  });
});
