import type { GraphQLClient } from 'graphql-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentPrice as GraphQLCurrentPrice } from '@/generated/graphql';
import { createGraphQLCurrentPriceRepository } from '../../src/current-prices';

describe('CurrentPrice Repository Adapter', () => {
  let mockClient: GraphQLClient;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    mockClient = {
      request: mockRequest,
    } as unknown as GraphQLClient;
  });

  const mockGraphQLCurrentPrices: GraphQLCurrentPrice[] = [
    {
      __typename: 'CurrentPrice',
      id: 'price-001',
      asset: '0xasset123',
      price: '1000000',
      timestamp: 1234567890,
    },
    {
      __typename: 'CurrentPrice',
      id: 'price-002',
      asset: '0xasset456',
      price: '2000000',
      timestamp: 1234567900,
    },
    {
      __typename: 'CurrentPrice',
      id: 'price-003',
      asset: '0xasset123',
      price: '1500000',
      timestamp: 1234567910,
    },
  ];

  describe('getCurrentPrices', () => {
    it('should fetch current prices with default options', async () => {
      mockRequest.mockResolvedValue({ currentPrices: { nodes: mockGraphQLCurrentPrices } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);
      const prices = await repository.getCurrentPrices();

      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(prices).toHaveLength(3);
      expect(prices[0]?.price).toBe(BigInt(1000000));
      expect(prices[0]?.asset).toBe('0xasset123');
    });

    it('should apply limit and offset options', async () => {
      mockRequest.mockResolvedValue({ currentPrices: { nodes: [mockGraphQLCurrentPrices[0]] } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);
      await repository.getCurrentPrices({ limit: 10, offset: 5 });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          limit: 10,
          offset: 5,
        })
      );
    });

    it('should use default limit and offset when not provided', async () => {
      mockRequest.mockResolvedValue({ currentPrices: { nodes: mockGraphQLCurrentPrices } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);
      await repository.getCurrentPrices();

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
        currentPrices: { nodes: [mockGraphQLCurrentPrices[0], mockGraphQLCurrentPrices[2]] },
      });

      const repository = createGraphQLCurrentPriceRepository(mockClient);

      await repository.getCurrentPrices({ asset: '0xasset123' });

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
      mockRequest.mockResolvedValue({ currentPrices: { nodes: mockGraphQLCurrentPrices } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);

      await repository.getCurrentPrices();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderBy: ['TIMESTAMP_DESC'],
        })
      );
    });

    it('should apply custom orderBy', async () => {
      mockRequest.mockResolvedValue({ currentPrices: { nodes: mockGraphQLCurrentPrices } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);

      await repository.getCurrentPrices({ orderBy: 'TIMESTAMP_ASC' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderBy: ['TIMESTAMP_ASC'],
        })
      );
    });

    it('should combine multiple options', async () => {
      mockRequest.mockResolvedValue({ currentPrices: { nodes: [mockGraphQLCurrentPrices[0]] } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);

      await repository.getCurrentPrices({
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
      mockRequest.mockResolvedValue({ currentPrices: { nodes: mockGraphQLCurrentPrices } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);

      await repository.getCurrentPrices({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: undefined,
        })
      );
    });

    it('should convert GraphQL current prices to domain current prices correctly', async () => {
      mockRequest.mockResolvedValue({ currentPrices: { nodes: [mockGraphQLCurrentPrices[0]] } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);
      const prices = await repository.getCurrentPrices();

      expect(prices).toHaveLength(1);
      expect(prices[0]?.asset).toBe('0xasset123');
      expect(prices[0]?.price).toBe(BigInt(1000000));
      expect(prices[0]?.timestamp).toBe(1234567890);
      expect(typeof prices[0]?.price).toBe('bigint');
      expect(Number.isInteger(prices[0]?.timestamp)).toBe(true);
    });

    it('should handle empty results', async () => {
      mockRequest.mockResolvedValue({ currentPrices: { nodes: [] } });

      const repository = createGraphQLCurrentPriceRepository(mockClient);
      const prices = await repository.getCurrentPrices();

      expect(prices).toHaveLength(0);
      expect(Array.isArray(prices)).toBe(true);
    });
  });
});
