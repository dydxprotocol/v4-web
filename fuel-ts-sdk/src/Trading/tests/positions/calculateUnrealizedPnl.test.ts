import { $decimalValue } from '@sdk/shared/models/DecimalValue';
import { OraclePrice } from '@sdk/shared/models/decimals';
import { describe, expect, it } from 'vitest';
import { PositionSide } from '../../src/Positions/domain/PositionsEntity';
import { calculateUnrealizedPnl } from '../../src/Positions/domain/calculations/calculateUnrealizedPnl';
import { PositionSize } from '../../src/Positions/domain/positionsDecimals';
import { createMinimalPosition } from './helpers/createMinimalPosition';

describe('calculateUnrealizedPnl', () => {
  describe('long positions', () => {
    it('should return positive PnL when price increases', () => {
      const position = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(10000), // $10,000 position
        entryPrice: OraclePrice.fromFloat(50000), // entered at $50,000
      });
      const markPrice = OraclePrice.fromFloat(55000); // now at $55,000 (10% up)

      const pnl = calculateUnrealizedPnl(position, markPrice);

      // Size at current price = 10000 * 55000 / 50000 = 11000
      // PnL = 11000 - 10000 = 1000
      expect($decimalValue(pnl).toFloat()).toBeCloseTo(1000, 0);
    });

    it('should return negative PnL when price decreases', () => {
      const position = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const markPrice = OraclePrice.fromFloat(45000); // 10% down

      const pnl = calculateUnrealizedPnl(position, markPrice);

      // Size at current price = 10000 * 45000 / 50000 = 9000
      // PnL = 9000 - 10000 = -1000
      expect($decimalValue(pnl).toFloat()).toBeCloseTo(-1000, 0);
    });

    it('should return zero PnL when price unchanged', () => {
      const position = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const markPrice = OraclePrice.fromFloat(50000);

      const pnl = calculateUnrealizedPnl(position, markPrice);

      expect($decimalValue(pnl).toFloat()).toBeCloseTo(0, 0);
    });
  });

  describe('short positions', () => {
    it('should return positive PnL when price decreases', () => {
      const position = createMinimalPosition({
        side: PositionSide.SHORT,
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const markPrice = OraclePrice.fromFloat(45000); // 10% down

      const pnl = calculateUnrealizedPnl(position, markPrice);

      // Size at current price = 10000 * 45000 / 50000 = 9000
      // PnL = 10000 - 9000 = 1000 (short profits when price drops)
      expect($decimalValue(pnl).toFloat()).toBeCloseTo(1000, 0);
    });

    it('should return negative PnL when price increases', () => {
      const position = createMinimalPosition({
        side: PositionSide.SHORT,
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const markPrice = OraclePrice.fromFloat(55000); // 10% up

      const pnl = calculateUnrealizedPnl(position, markPrice);

      // Size at current price = 10000 * 55000 / 50000 = 11000
      // PnL = 10000 - 11000 = -1000 (short loses when price rises)
      expect($decimalValue(pnl).toFloat()).toBeCloseTo(-1000, 0);
    });
  });

  describe('edge cases', () => {
    it('should return zero when position size is zero', () => {
      const position = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(0),
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const markPrice = OraclePrice.fromFloat(55000);

      const pnl = calculateUnrealizedPnl(position, markPrice);

      expect(pnl.value).toBe('0');
    });

    it('should return zero when entry price is zero', () => {
      const position = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(0),
      });
      const markPrice = OraclePrice.fromFloat(55000);

      const pnl = calculateUnrealizedPnl(position, markPrice);

      expect(pnl.value).toBe('0');
    });
  });
});
