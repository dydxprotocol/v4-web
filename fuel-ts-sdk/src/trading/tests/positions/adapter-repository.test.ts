import type { GraphQLClient } from 'graphql-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Position as GraphQLPosition } from '@/generated/graphql';
import { address, assetId } from '@/shared/types';
import { PositionChange, createGraphQLPositionRepository } from '../../src/positions';

describe('Position Repository Adapter', () => {
  let mockClient: GraphQLClient;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    mockClient = {
      request: mockRequest,
    } as unknown as GraphQLClient;
  });

  const mockGraphQLPositions: GraphQLPosition[] = [
    {
      __typename: 'Position',
      id: 'pos-001',
      positionKey: {
        __typename: 'PositionKey',
        id: 'pk-001',
        account: '0x1234567890abcdef',
        indexAssetId: '0xasset123',
        isLong: true,
      },
      collateralAmount: '1000000',
      size: '5000000',
      timestamp: 1234567890,
      latest: true,
      change: PositionChange.Increase,
      collateralTransferred: '500000',
      positionFee: '10000',
      fundingRate: '5000',
      pnlDelta: '100000',
      realizedFundingRate: '3000',
      realizedPnl: '50000',
    },
    {
      __typename: 'Position',
      id: 'pos-002',
      positionKey: {
        __typename: 'PositionKey',
        id: 'pk-002',
        account: '0x1234567890abcdef',
        indexAssetId: '0xasset456',
        isLong: false,
      },
      collateralAmount: '2000000',
      size: '8000000',
      timestamp: 1234567900,
      latest: true,
      change: PositionChange.Decrease,
      collateralTransferred: '300000',
      positionFee: '15000',
      fundingRate: '4000',
      pnlDelta: '-50000',
      realizedFundingRate: '2000',
      realizedPnl: '-25000',
    },
  ];

  describe('getPositions', () => {
    it('should fetch positions with default options', async () => {
      mockRequest.mockResolvedValue({ positions: mockGraphQLPositions });

      const repository = createGraphQLPositionRepository(mockClient);
      const positions = await repository.getPositions();

      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(positions).toHaveLength(2);
      expect(positions[0]?.id).toBe('pos-001');
      expect(positions[0]?.collateralAmount.value).toBe(BigInt(1000000));
    });

    it('should apply limit and offset options', async () => {
      mockRequest.mockResolvedValue({ positions: [mockGraphQLPositions[0]] });

      const repository = createGraphQLPositionRepository(mockClient);
      await repository.getPositions({ limit: 10, offset: 5 });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          limit: 10,
          offset: 5,
        })
      );
    });

    it('should filter by account', async () => {
      mockRequest.mockResolvedValue({ positions: mockGraphQLPositions });

      const repository = createGraphQLPositionRepository(mockClient);
      const testAccount = address('0x1234567890abcdef');

      await repository.getPositions({ account: testAccount });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              account_eq: testAccount,
            }),
          }),
        })
      );
    });

    it('should filter by asset ID', async () => {
      mockRequest.mockResolvedValue({ positions: [mockGraphQLPositions[0]] });

      const repository = createGraphQLPositionRepository(mockClient);
      const testAssetId = assetId('0xasset123');

      await repository.getPositions({ indexAssetId: testAssetId });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              indexAssetId_eq: testAssetId,
            }),
          }),
        })
      );
    });

    it('should filter by isLong', async () => {
      mockRequest.mockResolvedValue({ positions: [mockGraphQLPositions[0]] });

      const repository = createGraphQLPositionRepository(mockClient);

      await repository.getPositions({ isLong: true });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              isLong_eq: true,
            }),
          }),
        })
      );
    });

    it('should filter by latestOnly', async () => {
      mockRequest.mockResolvedValue({ positions: mockGraphQLPositions });

      const repository = createGraphQLPositionRepository(mockClient);

      await repository.getPositions({ latestOnly: true });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            latest_eq: true,
          }),
        })
      );
    });

    it('should apply custom orderBy', async () => {
      mockRequest.mockResolvedValue({ positions: mockGraphQLPositions });

      const repository = createGraphQLPositionRepository(mockClient);

      await repository.getPositions({ orderBy: 'timestamp_ASC' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderBy: ['timestamp_ASC'],
        })
      );
    });

    it('should combine multiple filters', async () => {
      mockRequest.mockResolvedValue({ positions: [mockGraphQLPositions[0]] });

      const repository = createGraphQLPositionRepository(mockClient);
      const testAccount = address('0x1234567890abcdef');
      const testAssetId = assetId('0xasset123');

      await repository.getPositions({
        account: testAccount,
        indexAssetId: testAssetId,
        isLong: true,
        latestOnly: true,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              account_eq: testAccount,
              indexAssetId_eq: testAssetId,
              isLong_eq: true,
            }),
            latest_eq: true,
          }),
        })
      );
    });

    it('should not include where clause when no filters provided', async () => {
      mockRequest.mockResolvedValue({ positions: mockGraphQLPositions });

      const repository = createGraphQLPositionRepository(mockClient);

      await repository.getPositions({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: undefined,
        })
      );
    });
  });

  describe('getPositionsByAccount', () => {
    it('should fetch positions for specific account with latestOnly=true by default', async () => {
      mockRequest.mockResolvedValue({ positions: mockGraphQLPositions });

      const repository = createGraphQLPositionRepository(mockClient);
      const testAccount = address('0x1234567890abcdef');

      await repository.getPositionsByAccount(testAccount);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              account_eq: testAccount,
            }),
            latest_eq: true,
          }),
        })
      );
    });

    it('should allow fetching all positions for account when latestOnly=false', async () => {
      mockRequest.mockResolvedValue({ positions: mockGraphQLPositions });

      const repository = createGraphQLPositionRepository(mockClient);
      const testAccount = address('0x1234567890abcdef');

      await repository.getPositionsByAccount(testAccount, false);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              account_eq: testAccount,
            }),
          }),
        })
      );

      const call = mockRequest.mock.calls[0]?.[1];
      expect(call.where.latest_eq).toBeUndefined();
    });
  });

  describe('getPositionsByAsset', () => {
    it('should fetch positions for specific asset with latestOnly=true by default', async () => {
      mockRequest.mockResolvedValue({ positions: [mockGraphQLPositions[0]] });

      const repository = createGraphQLPositionRepository(mockClient);
      const testAssetId = assetId('0xasset123');

      await repository.getPositionsByAsset(testAssetId);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              indexAssetId_eq: testAssetId,
            }),
            latest_eq: true,
          }),
        })
      );
    });

    it('should filter by isLong when provided', async () => {
      mockRequest.mockResolvedValue({ positions: [mockGraphQLPositions[0]] });

      const repository = createGraphQLPositionRepository(mockClient);
      const testAssetId = assetId('0xasset123');

      await repository.getPositionsByAsset(testAssetId, true);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            positionKey: expect.objectContaining({
              indexAssetId_eq: testAssetId,
              isLong_eq: true,
            }),
            latest_eq: true,
          }),
        })
      );
    });
  });
});
