import { describe, expect, it } from 'vitest';
import { calculateUnrealizedPnl } from '@/Trading/src/Positions/application/queries/calculate-unrealized-pnl';
import { PositionSize } from '@/Trading/src/Positions/domain/positions.decimals';
import { CollateralAmount, OraclePrice } from '@/shared/models/decimals';
import { createOpenLongPosition, createOpenShortPosition } from '../test-fixtures/positions';

describe('calculateUnrealizedPnl', () => {
  describe('long positions', () => {
    it('should calculate PnL from position history', () => {
      const history = [
        createOpenLongPosition({
          size: PositionSize.fromFloat(1), // 1 BTC
          collateralAmount: CollateralAmount.fromFloat(50000), // Cost basis $50k
          latest: true,
        }),
      ];

      const currentPrice = OraclePrice.fromFloat(55000); // Current at $55k

      const pnl = calculateUnrealizedPnl(history, currentPrice);

      // For long: PnL = (size * currentPrice) - costBasis = (1 * 55000) - 50000 = 5000
      expect(pnl.toFloat()).toBeCloseTo(5000, 0);
    });

    it('should return zero for no latest position', () => {
      const history = [
        createOpenLongPosition({
          latest: false,
        }),
      ];

      const currentPrice = OraclePrice.fromFloat(55000);

      const pnl = calculateUnrealizedPnl(history, currentPrice);

      expect(pnl.toFloat()).toBe(0);
    });
  });

  describe('short positions', () => {
    it('should calculate PnL for short position', () => {
      const history = [
        createOpenShortPosition({
          size: PositionSize.fromFloat(-1), // -1 BTC (short)
          collateralAmount: CollateralAmount.fromFloat(50000), // Cost basis $50k
          latest: true,
        }),
      ];

      const currentPrice = OraclePrice.fromFloat(45000); // Price decreased to $45k

      const pnl = calculateUnrealizedPnl(history, currentPrice);

      // For short: PnL = costBasis - (|size| * currentPrice) = 50000 - (1 * 45000) = 5000
      expect(pnl.toFloat()).toBeCloseTo(5000, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty position history', () => {
      const pnl = calculateUnrealizedPnl([], OraclePrice.fromFloat(50000));

      expect(pnl.toFloat()).toBe(0);
    });

    it('should use absolute value of size', () => {
      const history = [
        createOpenLongPosition({
          size: PositionSize.fromFloat(1),
          collateralAmount: CollateralAmount.fromFloat(50000),
          latest: true,
        }),
      ];

      const currentPrice = OraclePrice.fromFloat(60000);

      const pnl = calculateUnrealizedPnl(history, currentPrice);

      expect(pnl.toFloat()).toBeCloseTo(10000, 0);
    });
  });
});
