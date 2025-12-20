import { PercentageValue, UsdValue } from '@/shared/models/decimals';
import { describe, expect, it } from 'vitest';

import type { MarketConfig } from '@/trading/src/markets';
import {
  calculateInitialMargin,
  calculateMaintenanceMargin,
  calculateMaxLeverage,
  calculatePositionHealth,
  calculateRiskMetrics,
} from '../../src/positions/services/risk.service';

const mockMarketConfig: MarketConfig = {
  initialMarginFraction: 50000000000000000n,
  maintenanceMarginFraction: PercentageValue.fromBigInt(25000000000000000n),
  tickSizeDecimals: 2,
  stepSizeDecimals: 4,
};

describe('Risk Service', () => {
  describe('calculateInitialMargin', () => {
    it('should calculate initial margin correctly', () => {
      const notional = UsdValue.fromBigInt(100000000000000000n);

      const initialMargin = calculateInitialMargin(notional, mockMarketConfig);

      expect(initialMargin.value).toBe(5000000000000000n);
    });

    it('should return zero for zero notional', () => {
      const notional = UsdValue.fromBigInt(0n);

      const initialMargin = calculateInitialMargin(notional, mockMarketConfig);

      expect(initialMargin.value).toBe(0n);
    });

    it('should handle large notional values', () => {
      const notional = UsdValue.fromBigInt(1000000000000000000n);

      const initialMargin = calculateInitialMargin(notional, mockMarketConfig);

      expect(initialMargin.value).toBe(50000000000000000n);
    });
  });

  describe('calculateMaintenanceMargin', () => {
    it('should calculate maintenance margin correctly', () => {
      const notional = UsdValue.fromBigInt(100000000000000000n);

      const maintenanceMargin = calculateMaintenanceMargin(notional, mockMarketConfig);

      expect(maintenanceMargin.value).toBe(2500000000000000n);
    });

    it('should return zero for zero notional', () => {
      const notional = UsdValue.fromBigInt(0n);

      const maintenanceMargin = calculateMaintenanceMargin(notional, mockMarketConfig);

      expect(maintenanceMargin.value).toBe(0n);
    });

    it('should handle large notional values', () => {
      const notional = UsdValue.fromBigInt(1000000000000000000n);

      const maintenanceMargin = calculateMaintenanceMargin(notional, mockMarketConfig);

      expect(maintenanceMargin.value).toBe(25000000000000000n);
    });

    it('should be less than initial margin', () => {
      const notional = UsdValue.fromBigInt(100000000000000000n);

      const initialMargin = calculateInitialMargin(notional, mockMarketConfig);
      const maintenanceMargin = calculateMaintenanceMargin(notional, mockMarketConfig);

      expect(maintenanceMargin.value).toBeLessThan(initialMargin.value);
    });
  });

  describe('calculateMaxLeverage', () => {
    it('should calculate max leverage correctly', () => {
      const maxLeverage = calculateMaxLeverage(mockMarketConfig);

      expect(maxLeverage.toFloat()).toBeCloseTo(20, 1);
    });

    it('should return zero for zero IMF', () => {
      const config: MarketConfig = {
        ...mockMarketConfig,
        initialMarginFraction: 0n,
      };

      const maxLeverage = calculateMaxLeverage(config);

      expect(maxLeverage.value).toBe(0n);
    });

    it('should calculate for high leverage market', () => {
      const config: MarketConfig = {
        ...mockMarketConfig,
        initialMarginFraction: 10000000000000000n,
      };

      const maxLeverage = calculateMaxLeverage(config);

      expect(maxLeverage.toFloat()).toBeCloseTo(100, 1);
    });

    it('should calculate for conservative market', () => {
      const config: MarketConfig = {
        ...mockMarketConfig,
        initialMarginFraction: 100000000000000000n,
      };

      const maxLeverage = calculateMaxLeverage(config);

      expect(maxLeverage.toFloat()).toBeCloseTo(10, 1);
    });
  });

  describe('calculatePositionHealth', () => {
    it('should return 100% when equity exceeds maintenance margin', () => {
      const equity = UsdValue.fromBigInt(100000000000000000n);
      const maintenanceMargin = UsdValue.fromBigInt(50000000000000000n);

      const health = calculatePositionHealth(equity, maintenanceMargin);

      expect(health.toFloat()).toBeCloseTo(100, 1);
    });

    it('should return 50% when equity is half of maintenance margin', () => {
      const equity = UsdValue.fromBigInt(25000000000000000n);
      const maintenanceMargin = UsdValue.fromBigInt(50000000000000000n);

      const health = calculatePositionHealth(equity, maintenanceMargin);

      expect(health.toFloat()).toBeCloseTo(50, 1);
    });

    it('should return 0% for zero equity', () => {
      const equity = UsdValue.fromBigInt(0n);
      const maintenanceMargin = UsdValue.fromBigInt(50000000000000000n);

      const health = calculatePositionHealth(equity, maintenanceMargin);

      expect(health.value).toBe(0n);
    });

    it('should return 0% for zero maintenance margin', () => {
      const equity = UsdValue.fromBigInt(100000000000000000n);
      const maintenanceMargin = UsdValue.fromBigInt(0n);

      const health = calculatePositionHealth(equity, maintenanceMargin);

      expect(health.value).toBe(0n);
    });

    it('should cap at 100% for excess equity', () => {
      const equity = UsdValue.fromBigInt(200000000000000000n);
      const maintenanceMargin = UsdValue.fromBigInt(50000000000000000n);

      const health = calculatePositionHealth(equity, maintenanceMargin);

      expect(health.toFloat()).toBeCloseTo(100, 1);
    });

    it('should handle near-liquidation scenario', () => {
      const equity = UsdValue.fromBigInt(5000000000000000n);
      const maintenanceMargin = UsdValue.fromBigInt(50000000000000000n);

      const health = calculatePositionHealth(equity, maintenanceMargin);

      expect(health.toFloat()).toBeCloseTo(10, 1);
    });
  });

  describe('calculateRiskMetrics', () => {
    it('should calculate all risk metrics correctly', () => {
      const notional = UsdValue.fromBigInt(100000000000000000n);
      const equity = UsdValue.fromBigInt(50000000000000000n);

      const metrics = calculateRiskMetrics(notional, equity, mockMarketConfig);

      expect(metrics.initialMargin.value).toBe(5000000000000000n);
      expect(metrics.maintenanceMargin.value).toBe(2500000000000000n);
      expect(metrics.maxLeverage.toFloat()).toBeCloseTo(20, 1);
      expect(metrics.positionHealth.toFloat()).toBeCloseTo(100, 1);
    });

    it('should handle zero notional', () => {
      const notional = UsdValue.fromBigInt(0n);
      const equity = UsdValue.fromBigInt(50000000000000000n);

      const metrics = calculateRiskMetrics(notional, equity, mockMarketConfig);

      expect(metrics.initialMargin.value).toBe(0n);
      expect(metrics.maintenanceMargin.value).toBe(0n);
      expect(metrics.maxLeverage.toFloat()).toBeCloseTo(20, 1);
      expect(metrics.positionHealth.value).toBe(0n);
    });

    it('should handle zero equity', () => {
      const notional = UsdValue.fromBigInt(100000000000000000n);
      const equity = UsdValue.fromBigInt(0n);

      const metrics = calculateRiskMetrics(notional, equity, mockMarketConfig);

      expect(metrics.initialMargin.value).toBe(5000000000000000n);
      expect(metrics.maintenanceMargin.value).toBe(2500000000000000n);
      expect(metrics.maxLeverage.toFloat()).toBeCloseTo(20, 1);
      expect(metrics.positionHealth.value).toBe(0n);
    });

    it('should handle high-risk position', () => {
      const notional = UsdValue.fromBigInt(1000000000000000000n);
      const equity = UsdValue.fromBigInt(30000000000000000n);

      const metrics = calculateRiskMetrics(notional, equity, mockMarketConfig);

      expect(metrics.initialMargin.value).toBe(50000000000000000n);
      expect(metrics.maintenanceMargin.value).toBe(25000000000000000n);
      expect(metrics.positionHealth.toFloat()).toBeCloseTo(100, 1);
    });

    it('should handle near-liquidation position', () => {
      const notional = UsdValue.fromBigInt(100000000000000000n);
      const equity = UsdValue.fromBigInt(3000000000000000n);

      const metrics = calculateRiskMetrics(notional, equity, mockMarketConfig);

      expect(metrics.initialMargin.value).toBe(5000000000000000n);
      expect(metrics.maintenanceMargin.value).toBe(2500000000000000n);
      expect(metrics.positionHealth.toFloat()).toBeCloseTo(100, 1);
    });
  });
});
