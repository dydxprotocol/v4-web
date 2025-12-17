import { CollateralAmount, OraclePrice, UsdValue } from '@/shared/models/decimals';
import { address, assetId } from '@/shared/types';
import { describe, expect, it } from 'vitest';

import { PositionSize } from '../../src/positions/domain/positions.decimals';
import {
  calculateAccountEquity,
  calculateAccountLeverage,
  calculateAccountMetrics,
  calculateMarginUsage,
  calculateTotalNotional,
} from '../../src/account/services/account-metrics.service';
import { createMockPosition } from '../positions/helpers';

describe('Account Metrics Service', () => {
  describe('calculateAccountEquity', () => {
    it('should calculate equity with no positions', () => {
      const positions: any[] = [];
      const collateralBalance = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrices = new Map<string, OraclePrice>();

      const equity = calculateAccountEquity(positions, collateralBalance, oraclePrices);

      expect(equity.value).toBe(100000000000000000n);
    });

    it('should calculate equity with profitable position', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          latest: true,
        }),
      ];
      const collateralBalance = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrices = new Map([['0xasset1', OraclePrice.fromBigInt(50000000000000000000n)]]);

      const equity = calculateAccountEquity(positions, collateralBalance, oraclePrices);

      expect(equity.value).toBe(105000000000000000n);
    });

    it('should calculate equity with losing position', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(50000000000n),
          latest: true,
        }),
      ];
      const collateralBalance = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrices = new Map([['0xasset1', OraclePrice.fromBigInt(45000000000000000000n)]]);

      const equity = calculateAccountEquity(positions, collateralBalance, oraclePrices);

      expect(equity.value).toBe(95000000000000000n);
    });

    it('should calculate equity with multiple positions', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          latest: true,
        }),
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset2'),
            isLong: false,
          },
          size: PositionSize.fromBigInt(-500000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(30000000000n),
          latest: true,
        }),
      ];
      const collateralBalance = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrices = new Map([
        ['0xasset1', OraclePrice.fromBigInt(50000000000000000000n)],
        ['0xasset2', OraclePrice.fromBigInt(60000000000000000000n)],
      ]);

      const equity = calculateAccountEquity(positions, collateralBalance, oraclePrices);

      expect(equity.value).toBeGreaterThan(0n);
    });

    it('should skip positions without oracle prices', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          latest: true,
        }),
      ];
      const collateralBalance = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrices = new Map<string, OraclePrice>();

      const equity = calculateAccountEquity(positions, collateralBalance, oraclePrices);

      expect(equity.value).toBe(100000000000000000n);
    });
  });

  describe('calculateTotalNotional', () => {
    it('should return zero for no positions', () => {
      const positions: any[] = [];
      const oraclePrices = new Map<string, OraclePrice>();

      const notional = calculateTotalNotional(positions, oraclePrices);

      expect(notional.value).toBe(0n);
    });

    it('should calculate total notional for single position', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          latest: true,
        }),
      ];
      const oraclePrices = new Map([['0xasset1', OraclePrice.fromBigInt(50000000000000000000n)]]);

      const notional = calculateTotalNotional(positions, oraclePrices);

      expect(notional.value).toBe(50000000000000000n);
    });

    it('should calculate total notional for multiple positions', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          latest: true,
        }),
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset2'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(500000000000000000n),
          latest: true,
        }),
      ];
      const oraclePrices = new Map([
        ['0xasset1', OraclePrice.fromBigInt(50000000000000000000n)],
        ['0xasset2', OraclePrice.fromBigInt(60000000000000000000n)],
      ]);

      const notional = calculateTotalNotional(positions, oraclePrices);

      expect(notional.value).toBe(80000000000000000n);
    });

    it('should calculate absolute notional for short positions', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: false,
          },
          size: PositionSize.fromBigInt(-1000000000000000000n),
          latest: true,
        }),
      ];
      const oraclePrices = new Map([['0xasset1', OraclePrice.fromBigInt(50000000000000000000n)]]);

      const notional = calculateTotalNotional(positions, oraclePrices);

      expect(notional.value).toBe(50000000000000000n);
    });
  });

  describe('calculateAccountLeverage', () => {
    it('should calculate leverage correctly', () => {
      const totalNotional = UsdValue.fromBigInt(50000000000000000n);
      const equity = UsdValue.fromBigInt(100000000000000000n);

      const leverage = calculateAccountLeverage(totalNotional, equity);

      expect(leverage.toFloat()).toBeCloseTo(0.5, 2);
    });

    it('should return zero for zero equity', () => {
      const totalNotional = UsdValue.fromBigInt(50000000000000000n);
      const equity = UsdValue.fromBigInt(0n);

      const leverage = calculateAccountLeverage(totalNotional, equity);

      expect(leverage.value).toBe(0n);
    });

    it('should calculate high leverage', () => {
      const totalNotional = UsdValue.fromBigInt(500000000000000000n);
      const equity = UsdValue.fromBigInt(100000000000000000n);

      const leverage = calculateAccountLeverage(totalNotional, equity);

      expect(leverage.toFloat()).toBeCloseTo(5, 2);
    });

    it('should handle extreme leverage', () => {
      const totalNotional = UsdValue.fromBigInt(1000000000000000000n);
      const equity = UsdValue.fromBigInt(50000000000000000n);

      const leverage = calculateAccountLeverage(totalNotional, equity);

      expect(leverage.toFloat()).toBeCloseTo(20, 2);
    });
  });

  describe('calculateMarginUsage', () => {
    it('should calculate margin usage correctly', () => {
      const usedMargin = UsdValue.fromBigInt(50000000000000000n);
      const totalMargin = UsdValue.fromBigInt(100000000000000000n);

      const usage = calculateMarginUsage(usedMargin, totalMargin);

      expect(usage.toFloat()).toBeCloseTo(50, 2);
    });

    it('should return zero for zero total margin', () => {
      const usedMargin = UsdValue.fromBigInt(50000000000000000n);
      const totalMargin = UsdValue.fromBigInt(0n);

      const usage = calculateMarginUsage(usedMargin, totalMargin);

      expect(usage.value).toBe(0n);
    });

    it('should calculate 100% margin usage', () => {
      const usedMargin = UsdValue.fromBigInt(100000000000000000n);
      const totalMargin = UsdValue.fromBigInt(100000000000000000n);

      const usage = calculateMarginUsage(usedMargin, totalMargin);

      expect(usage.toFloat()).toBeCloseTo(100, 2);
    });

    it('should calculate low margin usage', () => {
      const usedMargin = UsdValue.fromBigInt(10000000000000000n);
      const totalMargin = UsdValue.fromBigInt(100000000000000000n);

      const usage = calculateMarginUsage(usedMargin, totalMargin);

      expect(usage.toFloat()).toBeCloseTo(10, 2);
    });
  });

  describe('calculateAccountMetrics', () => {
    it('should calculate all metrics for account with positions', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          latest: true,
        }),
      ];
      const collateralBalance = UsdValue.fromBigInt(100000000000000000n);
      const oraclePrices = new Map([['0xasset1', OraclePrice.fromBigInt(50000000000000000000n)]]);
      const usedMargin = UsdValue.fromBigInt(25000000000000000n);

      const metrics = calculateAccountMetrics(positions, collateralBalance, oraclePrices, usedMargin);

      expect(metrics.equity.value).toBeGreaterThan(0n);
      expect(metrics.totalNotional.value).toBe(50000000000000000n);
      expect(metrics.accountLeverage.toFloat()).toBeGreaterThan(0);
      expect(metrics.marginUsage.toFloat()).toBeGreaterThan(0);
    });

    it('should handle zero equity scenario', () => {
      const positions: any[] = [];
      const collateralBalance = UsdValue.fromBigInt(0n);
      const oraclePrices = new Map<string, OraclePrice>();
      const usedMargin = UsdValue.fromBigInt(0n);

      const metrics = calculateAccountMetrics(positions, collateralBalance, oraclePrices, usedMargin);

      expect(metrics.equity.value).toBe(0n);
      expect(metrics.totalNotional.value).toBe(0n);
      expect(metrics.accountLeverage.value).toBe(0n);
      expect(metrics.marginUsage.value).toBe(0n);
    });

    it('should calculate metrics with multiple positions', () => {
      const positions = [
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset1'),
            isLong: true,
          },
          size: PositionSize.fromBigInt(1000000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(45000000000n),
          latest: true,
        }),
        createMockPosition({
          positionKey: {
            account: address('0x123'),
            indexAssetId: assetId('0xasset2'),
            isLong: false,
          },
          size: PositionSize.fromBigInt(-500000000000000000n),
          collateralAmount: CollateralAmount.fromBigInt(25000000000n),
          latest: true,
        }),
      ];
      const collateralBalance = UsdValue.fromBigInt(200000000000000000n);
      const oraclePrices = new Map([
        ['0xasset1', OraclePrice.fromBigInt(50000000000000000000n)],
        ['0xasset2', OraclePrice.fromBigInt(60000000000000000000n)],
      ]);
      const usedMargin = UsdValue.fromBigInt(80000000000000000n);

      const metrics = calculateAccountMetrics(positions, collateralBalance, oraclePrices, usedMargin);

      expect(metrics.equity.value).toBeGreaterThan(0n);
      expect(metrics.totalNotional.value).toBe(80000000000000000n);
      expect(metrics.accountLeverage.toFloat()).toBeGreaterThan(0);
      expect(metrics.marginUsage.toFloat()).toBeGreaterThan(0);
    });
  });
});
