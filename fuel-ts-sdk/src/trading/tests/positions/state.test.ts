import { describe, expect, it } from 'vitest';

import { address, assetId, positionId } from '@/shared/types';
import {
  filterClosedPositions,
  filterOpenPositions,
  getPositionSide,
  getPositionStatus,
  isPositionClosed,
  isPositionOpen,
  PositionChange,
  PositionSide,
  PositionStatus,
} from '../../src/positions/domain';
import { PositionSize } from '../../src/positions/domain/positions.decimals';
import { createMockPosition } from './helpers';

describe('Position State Utilities', () => {
  describe('getPositionStatus', () => {
    it('should return OPEN for latest position with non-zero size', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(1000n),
        change: PositionChange.Increase,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.OPEN);
    });

    it('should return CLOSED for position with CLOSE change', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(0n),
        change: PositionChange.Close,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });

    it('should return CLOSED for position with LIQUIDATE change', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(0n),
        change: PositionChange.Liquidate,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });

    it('should return CLOSED for position with zero size', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(0n),
        change: PositionChange.Decrease,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });

    it('should return CLOSED for non-latest position', () => {
      const position = createMockPosition({
        latest: false,
        size: PositionSize.fromBigInt(1000n),
        change: PositionChange.Increase,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });
  });

  describe('getPositionSide', () => {
    it('should return LONG when isLong is true', () => {
      const position = createMockPosition({
        positionKey: {
          account: address('0x123'),
          indexAssetId: assetId('0xasset'),
          isLong: true,
        },
      });

      expect(getPositionSide(position)).toBe(PositionSide.LONG);
    });

    it('should return SHORT when isLong is false', () => {
      const position = createMockPosition({
        positionKey: {
          account: address('0x123'),
          indexAssetId: assetId('0xasset'),
          isLong: false,
        },
      });

      expect(getPositionSide(position)).toBe(PositionSide.SHORT);
    });
  });

  describe('isPositionOpen', () => {
    it('should return true for open position', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(1000n),
        change: PositionChange.Increase,
      });

      expect(isPositionOpen(position)).toBe(true);
    });

    it('should return false for closed position', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(0n),
        change: PositionChange.Close,
      });

      expect(isPositionOpen(position)).toBe(false);
    });
  });

  describe('isPositionClosed', () => {
    it('should return true for closed position', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(0n),
        change: PositionChange.Close,
      });

      expect(isPositionClosed(position)).toBe(true);
    });

    it('should return false for open position', () => {
      const position = createMockPosition({
        latest: true,
        size: PositionSize.fromBigInt(1000n),
        change: PositionChange.Increase,
      });

      expect(isPositionClosed(position)).toBe(false);
    });
  });

  describe('filterOpenPositions', () => {
    it('should filter only open positions', () => {
      const positions = [
        createMockPosition({ id: positionId('1'), latest: true, size: PositionSize.fromBigInt(1000n), change: PositionChange.Increase }),
        createMockPosition({ id: positionId('2'), latest: true, size: PositionSize.fromBigInt(0n), change: PositionChange.Close }),
        createMockPosition({ id: positionId('3'), latest: true, size: PositionSize.fromBigInt(500n), change: PositionChange.Increase }),
        createMockPosition({ id: positionId('4'), latest: false, size: PositionSize.fromBigInt(200n), change: PositionChange.Decrease }),
      ];

      const openPositions = filterOpenPositions(positions);

      expect(openPositions).toHaveLength(2);
      expect(openPositions[0].id).toBe(positionId('1'));
      expect(openPositions[1].id).toBe(positionId('3'));
    });

    it('should return empty array when no open positions', () => {
      const positions = [
        createMockPosition({ latest: true, size: PositionSize.fromBigInt(0n), change: PositionChange.Close }),
        createMockPosition({ latest: false, size: PositionSize.fromBigInt(1000n), change: PositionChange.Increase }),
      ];

      const openPositions = filterOpenPositions(positions);

      expect(openPositions).toHaveLength(0);
    });
  });

  describe('filterClosedPositions', () => {
    it('should filter only closed positions', () => {
      const positions = [
        createMockPosition({ id: positionId('1'), latest: true, size: PositionSize.fromBigInt(1000n), change: PositionChange.Increase }),
        createMockPosition({ id: positionId('2'), latest: true, size: PositionSize.fromBigInt(0n), change: PositionChange.Close }),
        createMockPosition({ id: positionId('3'), latest: true, size: PositionSize.fromBigInt(500n), change: PositionChange.Increase }),
        createMockPosition({ id: positionId('4'), latest: false, size: PositionSize.fromBigInt(200n), change: PositionChange.Decrease }),
      ];

      const closedPositions = filterClosedPositions(positions);

      expect(closedPositions).toHaveLength(2);
      expect(closedPositions[0].id).toBe(positionId('2'));
      expect(closedPositions[1].id).toBe(positionId('4'));
    });

    it('should return empty array when no closed positions', () => {
      const positions = [
        createMockPosition({ latest: true, size: PositionSize.fromBigInt(1000n), change: PositionChange.Increase }),
        createMockPosition({ latest: true, size: PositionSize.fromBigInt(500n), change: PositionChange.Increase }),
      ];

      const closedPositions = filterClosedPositions(positions);

      expect(closedPositions).toHaveLength(0);
    });
  });
});
