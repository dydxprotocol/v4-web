import { describe, expect, it } from 'vitest';
import { address, assetId, positionId } from '@/shared/types';
import { PositionChange, PositionKeySchema, PositionSchema } from '../../src/positions';

describe('Position Domain', () => {
  describe('PositionKeySchema', () => {
    it('should validate a valid position key', () => {
      const validKey = {
        account: address('0x123abc'),
        indexAssetId: assetId('0xasset123'),
        isLong: true,
      };

      const result = PositionKeySchema.safeParse(validKey);
      expect(result.success).toBe(true);
    });

    it('should reject empty account address', () => {
      const invalidKey = {
        account: '',
        indexAssetId: assetId('0xasset123'),
        isLong: true,
      };

      expect(() => PositionKeySchema.parse(invalidKey)).toThrow();
    });

    it('should reject empty asset ID', () => {
      const invalidKey = {
        account: address('0x123abc'),
        indexAssetId: '',
        isLong: true,
      };

      expect(() => PositionKeySchema.parse(invalidKey)).toThrow();
    });
  });

  describe('PositionSchema', () => {
    it('should validate a complete position', () => {
      const validPosition = {
        id: positionId('pos-123'),
        positionKey: {
          account: address('0x123abc'),
          indexAssetId: assetId('0xasset123'),
          isLong: true,
        },
        collateralAmount: BigInt(1000),
        size: BigInt(5000),
        timestamp: 1234567890,
        latest: true,
        change: PositionChange.Increase,
        collateralTransferred: BigInt(500),
        positionFee: BigInt(10),
        fundingRate: BigInt(5),
        pnlDelta: BigInt(100),
        realizedFundingRate: BigInt(3),
        realizedPnl: BigInt(50),
      };

      const result = PositionSchema.safeParse(validPosition);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('pos-123');
        expect(result.data.change).toBe(PositionChange.Increase);
      }
    });

    it('should reject invalid position change enum', () => {
      const invalidPosition = {
        id: positionId('pos-123'),
        positionKey: {
          account: address('0x123abc'),
          indexAssetId: assetId('0xasset123'),
          isLong: true,
        },
        collateralAmount: BigInt(1000),
        size: BigInt(5000),
        timestamp: 1234567890,
        latest: true,
        change: 'INVALID_CHANGE' as any,
        collateralTransferred: BigInt(500),
        positionFee: BigInt(10),
        fundingRate: BigInt(5),
        pnlDelta: BigInt(100),
        realizedFundingRate: BigInt(3),
        realizedPnl: BigInt(50),
      };

      expect(() => PositionSchema.parse(invalidPosition)).toThrow();
    });

    it('should accept all valid PositionChange values', () => {
      const changes = [
        PositionChange.Increase,
        PositionChange.Decrease,
        PositionChange.Close,
        PositionChange.Liquidate,
      ];

      changes.forEach((change) => {
        const position = {
          id: positionId('pos-123'),
          positionKey: {
            account: address('0x123abc'),
            indexAssetId: assetId('0xasset123'),
            isLong: true,
          },
          collateralAmount: BigInt(1000),
          size: BigInt(5000),
          timestamp: 1234567890,
          latest: true,
          change,
          collateralTransferred: BigInt(500),
          positionFee: BigInt(10),
          fundingRate: BigInt(5),
          pnlDelta: BigInt(100),
          realizedFundingRate: BigInt(3),
          realizedPnl: BigInt(50),
        };

        const result = PositionSchema.safeParse(position);
        expect(result.success).toBe(true);
      });
    });
  });
});
