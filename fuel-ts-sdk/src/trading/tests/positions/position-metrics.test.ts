import { describe, expect, it } from 'vitest';
import { CollateralAmount, OraclePrice, UsdValue } from '@/shared/models/decimals';
import { address, assetId, positionId } from '@/shared/types';
import { calculateLeverage } from '../../src/positions/application/queries/calculate-leverage';
import { calculateNotional } from '../../src/positions/application/queries/calculate-notional';
import { calculateUnrealizedPnl } from '../../src/positions/application/queries/calculate-unrealized-pnl';
import { calculateUnrealizedPnlPercent } from '../../src/positions/application/queries/calculate-unrealized-pnl-percent';
import { PositionSize } from '../../src/positions/domain/positions.decimals';
import { PositionChange } from '../../src/positions/domain/positions.entity';
import { createMockPosition } from './helpers';

describe('Position Metrics Service', () => {
  describe('calculateNotional', () => {
    it('should calculate notional for positive size', () => {
      const positionHistory = [
        createMockPosition({
          size: PositionSize.fromBigInt(1000000000000000000n),
          latest: true,
        }),
      ];
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const notional = calculateNotional(positionHistory, oraclePrice);

      expect(notional.value).toBe(50000000000000000n);
    });

    it('should calculate notional for negative size (short)', () => {
      const positionHistory = [
        createMockPosition({
          size: PositionSize.fromBigInt(-1000000000000000000n),
          latest: true,
        }),
      ];
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const notional = calculateNotional(positionHistory, oraclePrice);

      expect(notional.value).toBe(50000000000000000n);
    });

    it('should return zero for empty history', () => {
      const positionHistory: any[] = [];
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const notional = calculateNotional(positionHistory, oraclePrice);

      expect(notional.value).toBe(0n);
    });
  });

  describe('calculateUnrealizedPnl', () => {
    it('should calculate positive PnL for long position with price increase', () => {
      const positionHistory = [
        createMockPosition({
          id: positionId('1'),
          change: PositionChange.Increase,
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          collateralTransferred: CollateralAmount.fromBigInt(45000000000n),
          latest: false,
        }),
        createMockPosition({
          id: positionId('2'),
          change: PositionChange.Increase,
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          collateralTransferred: CollateralAmount.fromBigInt(45000000000n),
          latest: true,
        }),
      ];
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const pnl = calculateUnrealizedPnl(positionHistory, oraclePrice);

      expect(pnl.value).toBe(5000000000000000n);
    });

    it('should calculate negative PnL for long position with price decrease', () => {
      const positionHistory = [
        createMockPosition({
          change: PositionChange.Increase,
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(50000000000n),
          collateralTransferred: CollateralAmount.fromBigInt(50000000000n),
          latest: true,
        }),
      ];
      const oraclePrice = OraclePrice.fromBigInt(45000000000000000000n);

      const pnl = calculateUnrealizedPnl(positionHistory, oraclePrice);

      expect(pnl.value).toBe(-5000000000000000n);
    });

    it('should calculate positive PnL for short position with price decrease', () => {
      const positionHistory = [
        createMockPosition({
          change: PositionChange.Increase,
          size: PositionSize.fromBigInt(-1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(50000000000n),
          collateralTransferred: CollateralAmount.fromBigInt(50000000000n),
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset'),
            isLong: false,
          },
          latest: true,
        }),
      ];
      const oraclePrice = OraclePrice.fromBigInt(45000000000000000000n);

      const pnl = calculateUnrealizedPnl(positionHistory, oraclePrice);

      expect(pnl.value).toBe(5000000000000000n);
    });

    it('should calculate negative PnL for short position with price increase', () => {
      const positionHistory = [
        createMockPosition({
          change: PositionChange.Increase,
          size: PositionSize.fromBigInt(-1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          collateralTransferred: CollateralAmount.fromBigInt(45000000000n),
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset'),
            isLong: false,
          },
          latest: true,
        }),
      ];
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const pnl = calculateUnrealizedPnl(positionHistory, oraclePrice);

      expect(pnl.value).toBe(-5000000000000000n);
    });
  });

  describe('calculateUnrealizedPnlPercent', () => {
    it('should calculate PnL percentage', () => {
      const positionHistory = [
        createMockPosition({
          change: PositionChange.Increase,
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          collateralTransferred: CollateralAmount.fromBigInt(45000000000n),
          latest: true,
        }),
      ];
      const equity = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const pnlPercent = calculateUnrealizedPnlPercent(positionHistory, equity, oraclePrice);

      expect(pnlPercent.value).toBe(5n);
    });

    it('should return zero for zero equity', () => {
      const positionHistory = [
        createMockPosition({
          change: PositionChange.Increase,
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralTransferred: CollateralAmount.fromBigInt(45000000000n),
          latest: true,
        }),
      ];
      const equity = UsdValue.fromBigInt(0n);
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const pnlPercent = calculateUnrealizedPnlPercent(positionHistory, equity, oraclePrice);

      expect(pnlPercent.value).toBe(0n);
    });
  });

  describe('calculateLeverage', () => {
    it('should calculate leverage correctly', () => {
      const positionHistory = [
        createMockPosition({
          size: PositionSize.fromBigInt(1000000000000000000n),
          latest: true,
        }),
      ];
      const equity = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const leverage = calculateLeverage(positionHistory, equity, oraclePrice);

      expect(leverage.toFloat()).toBeCloseTo(0.5, 2);
    });

    it('should return zero for zero equity', () => {
      const positionHistory = [
        createMockPosition({
          size: PositionSize.fromBigInt(1000000000000000000n),
          latest: true,
        }),
      ];
      const equity = UsdValue.fromBigInt(0n);
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const leverage = calculateLeverage(positionHistory, equity, oraclePrice);

      expect(leverage.value).toBe(0n);
    });

    it('should handle high leverage positions', () => {
      const positionHistory = [
        createMockPosition({
          size: PositionSize.fromBigInt(1000000000000000000n),
          latest: true,
        }),
      ];
      const equity = UsdValue.fromBigInt(10000000000000000n);
      const oraclePrice = OraclePrice.fromBigInt(50000000000000000000n);

      const leverage = calculateLeverage(positionHistory, equity, oraclePrice);

      expect(leverage.toFloat()).toBeCloseTo(5, 2);
    });
  });

  // calculateLiquidationPrice moved to domain-services/queries (requires DI with market queries)
  // Tests for it should be in a separate domain-services test file
});
