import { $decimalValue } from '@sdk/shared/models/DecimalValue';
import { CollateralAmount, OraclePrice } from '@sdk/shared/models/decimals';
import { describe, expect, it } from 'vitest';
import { PositionSide } from '../../src/Positions/domain/PositionsEntity';
import { calculateLiquidationPriceApprox } from '../../src/Positions/domain/calculations/calculateLiquidationPriceApprox';
import { PositionSize } from '../../src/Positions/domain/positionsDecimals';
import { createMinimalPosition } from './helpers/createMinimalPosition';

describe('calculateLiquidationPriceApprox', () => {
  describe('long positions', () => {
    it('should calculate liquidation price below entry price', () => {
      const position = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(10000), // $10,000 position
        collateral: CollateralAmount.fromFloat(1000), // $1,000 collateral (10x leverage)
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const maxLeverage = 50; // 50x max leverage

      const liqPrice = calculateLiquidationPriceApprox(position, maxLeverage);

      // For long: liq price should be below entry price
      expect($decimalValue(liqPrice).toFloat()).toBeLessThan(50000);
      expect($decimalValue(liqPrice).toFloat()).toBeGreaterThan(0);
    });

    it('should return entry price when at max leverage', () => {
      const position = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(50000), // $50,000 position
        collateral: CollateralAmount.fromFloat(1000), // $1,000 collateral (50x leverage)
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const maxLeverage = 50; // already at max leverage

      const liqPrice = calculateLiquidationPriceApprox(position, maxLeverage);

      // When at max leverage, liquidation is immediate (at entry price)
      expect($decimalValue(liqPrice).toFloat()).toBeCloseTo(50000, 0);
    });

    it('should have lower liquidation price with more collateral', () => {
      const positionLowCollateral = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(10000),
        collateral: CollateralAmount.fromFloat(500),
        entryPrice: OraclePrice.fromFloat(50000),
      });

      const positionHighCollateral = createMinimalPosition({
        side: PositionSide.LONG,
        size: PositionSize.fromFloat(10000),
        collateral: CollateralAmount.fromFloat(2000),
        entryPrice: OraclePrice.fromFloat(50000),
      });

      const maxLeverage = 50;

      const liqPriceLow = calculateLiquidationPriceApprox(positionLowCollateral, maxLeverage);
      const liqPriceHigh = calculateLiquidationPriceApprox(positionHighCollateral, maxLeverage);

      // More collateral = lower liquidation price (more room for price to drop)
      expect($decimalValue(liqPriceLow).toFloat()).toBeGreaterThan(
        $decimalValue(liqPriceHigh).toFloat()
      );
    });
  });

  describe('short positions', () => {
    it('should calculate liquidation price above entry price', () => {
      const position = createMinimalPosition({
        side: PositionSide.SHORT,
        size: PositionSize.fromFloat(10000),
        collateral: CollateralAmount.fromFloat(1000),
        entryPrice: OraclePrice.fromFloat(50000),
      });
      const maxLeverage = 50;

      const liqPrice = calculateLiquidationPriceApprox(position, maxLeverage);

      // For short: liq price should be above entry price
      expect($decimalValue(liqPrice).toFloat()).toBeGreaterThan(50000);
    });

    it('should have higher liquidation price with less collateral', () => {
      const positionLowCollateral = createMinimalPosition({
        side: PositionSide.SHORT,
        size: PositionSize.fromFloat(10000),
        collateral: CollateralAmount.fromFloat(500),
        entryPrice: OraclePrice.fromFloat(50000),
      });

      const positionHighCollateral = createMinimalPosition({
        side: PositionSide.SHORT,
        size: PositionSize.fromFloat(10000),
        collateral: CollateralAmount.fromFloat(2000),
        entryPrice: OraclePrice.fromFloat(50000),
      });

      const maxLeverage = 50;

      const liqPriceLow = calculateLiquidationPriceApprox(positionLowCollateral, maxLeverage);
      const liqPriceHigh = calculateLiquidationPriceApprox(positionHighCollateral, maxLeverage);

      // Less collateral = lower liquidation price (less room for price to rise)
      expect($decimalValue(liqPriceLow).toFloat()).toBeLessThan(
        $decimalValue(liqPriceHigh).toFloat()
      );
    });
  });

  describe('edge cases', () => {
    it('should return zero when position size is zero', () => {
      const position = createMinimalPosition({
        size: PositionSize.fromFloat(0),
        entryPrice: OraclePrice.fromFloat(50000),
      });

      const liqPrice = calculateLiquidationPriceApprox(position, 50);

      expect(liqPrice.value).toBe('0');
    });

    it('should return zero when entry price is zero', () => {
      const position = createMinimalPosition({
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(0),
      });

      const liqPrice = calculateLiquidationPriceApprox(position, 50);

      expect(liqPrice.value).toBe('0');
    });

    it('should return zero when max leverage is zero', () => {
      const position = createMinimalPosition({
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(50000),
      });

      const liqPrice = calculateLiquidationPriceApprox(position, 0);

      expect(liqPrice.value).toBe('0');
    });

    it('should return zero when max leverage is negative', () => {
      const position = createMinimalPosition({
        size: PositionSize.fromFloat(10000),
        entryPrice: OraclePrice.fromFloat(50000),
      });

      const liqPrice = calculateLiquidationPriceApprox(position, -10);

      expect(liqPrice.value).toBe('0');
    });
  });
});
