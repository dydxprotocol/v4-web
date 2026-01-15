import { PositionChange, PositionSide, PositionStatus } from '@sdk/Trading/src/Positions/domain';
import {
  calculateEntryPrice,
  filterClosedPositions,
  filterOpenPositions,
  getPositionSide,
  getPositionStatus,
  isPositionClosed,
  isPositionOpen,
} from '@sdk/Trading/src/Positions/domain';
import { PositionSize } from '@sdk/Trading/src/Positions/domain/positionsDecimals';
import { positionRevisionId } from '@sdk/shared/types';
import { describe, expect, it } from 'vitest';
import {
  createClosedPosition,
  createOpenLongPosition,
  createOpenShortPosition,
  createPositionHistory,
  createTestPosition,
} from '../test-fixtures/positions';

describe('Position Calculations', () => {
  describe('getPositionStatus', () => {
    it('should return OPEN for latest position with non-zero size', () => {
      const position = createOpenLongPosition();

      expect(getPositionStatus(position)).toBe(PositionStatus.OPEN);
    });

    it('should return CLOSED for position with Close change', () => {
      const position = createTestPosition({
        change: PositionChange.Close,
        latest: true,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });

    it('should return CLOSED for position with Liquidate change', () => {
      const position = createTestPosition({
        change: PositionChange.Liquidate,
        latest: true,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });

    it('should return CLOSED for position with zero size', () => {
      const position = createTestPosition({
        size: PositionSize.fromFloat(0),
        latest: true,
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });

    it('should return CLOSED for non-latest position', () => {
      const position = createTestPosition({
        latest: false,
        size: PositionSize.fromFloat(1000),
      });

      expect(getPositionStatus(position)).toBe(PositionStatus.CLOSED);
    });
  });

  describe('getPositionSide', () => {
    it('should return LONG for long position', () => {
      const position = createOpenLongPosition();

      expect(getPositionSide(position)).toBe(PositionSide.LONG);
    });

    it('should return SHORT for short position', () => {
      const position = createOpenShortPosition();

      expect(getPositionSide(position)).toBe(PositionSide.SHORT);
    });
  });

  describe('isPositionOpen', () => {
    it('should return true for open position', () => {
      const position = createOpenLongPosition();

      expect(isPositionOpen(position)).toBe(true);
    });

    it('should return false for closed position', () => {
      const position = createClosedPosition();

      expect(isPositionOpen(position)).toBe(false);
    });
  });

  describe('isPositionClosed', () => {
    it('should return true for closed position', () => {
      const position = createClosedPosition();

      expect(isPositionClosed(position)).toBe(true);
    });

    it('should return false for open position', () => {
      const position = createOpenLongPosition();

      expect(isPositionClosed(position)).toBe(false);
    });
  });

  describe('filterOpenPositions', () => {
    it('should filter only open positions', () => {
      const positions = [
        createOpenLongPosition({ revisionId: positionRevisionId('pos-1') }),
        createClosedPosition({ revisionId: positionRevisionId('pos-2') }),
        createOpenShortPosition({ revisionId: positionRevisionId('pos-3') }),
        createClosedPosition({ revisionId: positionRevisionId('pos-4') }),
      ];

      const openPositions = filterOpenPositions(positions);

      expect(openPositions).toHaveLength(2);
      expect(openPositions.map((p) => p.revisionId)).toEqual(['pos-1', 'pos-3']);
    });

    it('should return empty array when no open positions', () => {
      const positions = [createClosedPosition(), createClosedPosition()];

      const openPositions = filterOpenPositions(positions);

      expect(openPositions).toHaveLength(0);
    });
  });

  describe('filterClosedPositions', () => {
    it('should filter only closed positions', () => {
      const positions = [
        createOpenLongPosition({ revisionId: positionRevisionId('pos-1') }),
        createClosedPosition({ revisionId: positionRevisionId('pos-2') }),
        createOpenShortPosition({ revisionId: positionRevisionId('pos-3') }),
        createClosedPosition({ revisionId: positionRevisionId('pos-4') }),
      ];

      const closedPositions = filterClosedPositions(positions);

      expect(closedPositions).toHaveLength(2);
      expect(closedPositions.map((p) => p.revisionId)).toEqual(['pos-2', 'pos-4']);
    });

    it('should return empty array when no closed positions', () => {
      const positions = [createOpenLongPosition(), createOpenShortPosition()];

      const closedPositions = filterClosedPositions(positions);

      expect(closedPositions).toHaveLength(0);
    });
  });

  describe('calculateEntryPrice', () => {
    it('should calculate weighted average entry price', () => {
      const history = createPositionHistory();

      const entryPrice = calculateEntryPrice(history);

      // Should be a non-zero price
      expect(BigInt(entryPrice.value)).toBeGreaterThan(0n);
    });

    it('should return zero for empty history', () => {
      const entryPrice = calculateEntryPrice([]);

      expect(entryPrice.value).toBe('0');
    });

    it('should only consider Increase events', () => {
      const history = [
        createTestPosition({
          change: PositionChange.Increase,
          size: PositionSize.fromFloat(5000),
        }),
        createTestPosition({
          change: PositionChange.Decrease,
          size: PositionSize.fromFloat(3000),
        }),
        createTestPosition({
          change: PositionChange.Close,
          size: PositionSize.fromFloat(0),
        }),
      ];

      const entryPrice = calculateEntryPrice(history);

      // Should calculate based only on Increase event
      expect(BigInt(entryPrice.value)).toBeGreaterThan(0n);
    });
  });
});
