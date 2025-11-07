import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS } from '@/lib/numbers';

import {
  calculateBreakEvenWithFunding,
  calculateCompleteFundingAnalysis,
  calculateFundingCost,
  calculateFundingCostRange,
  calculateFundingCosts,
  calculateFundingCostSafe,
  calculateFundingProjections,
  calculateTradeFundingCost,
  getFundingDirection,
  getFundingRateInfo,
  isExtremeFundingRate,
  isHighFundingRate,
} from '../fundingCalculations';
import type { MarketInfo, SubaccountPosition } from '../../types/summaryTypes';

// Mock data helpers
const createMockMarket = (fundingRate: number): MarketInfo => ({
  assetId: 'BTC',
  displayableAsset: 'BTC',
  displayableTicker: 'BTC-USD',
  effectiveInitialMarginFraction: 0.05,
  openInterestUSDC: 1000000,
  percentChange24h: 5,
  stepSizeDecimals: 4,
  tickSizeDecimals: 2,
  nextFundingRate: fundingRate,
  atomicResolution: -9,
  clobPairId: 1,
  initialMarginFraction: '0.05',
  logo: null,
  maintenanceMarginFraction: '0.03',
  marketType: 'PERPETUAL' as any,
  oraclePrice: 50000,
  priceChange24H: 2500,
  quantumConversionExponent: -6,
  status: 'ACTIVE' as any,
  stepBaseQuantums: BigInt(1000),
  stepSize: '0.0001',
  subticksPerTick: 100,
  ticker: 'BTC-USD',
  tickSize: '0.01',
  trades24H: 1000,
  volume24H: 50000000,
  baseOpenInterest: '100',
  defaultFundingRate1H: 0.0001,
  openInterest: 1000,
  openInterestLowerCap: null,
  openInterestUpperCap: null,
});

const createMockPosition = (
  side: IndexerPositionSide,
  size: number,
  entryPrice: number,
  netFunding: number = 0
): Partial<SubaccountPosition> => ({
  side,
  market: 'BTC-USD',
  subaccountNumber: 0,
  unsignedSize: new BigNumber(size),
  signedSize: side === IndexerPositionSide.LONG ? new BigNumber(size) : new BigNumber(-size),
  notional: new BigNumber(size).times(entryPrice),
  baseEntryPrice: new BigNumber(entryPrice),
  baseNetFunding: new BigNumber(netFunding),
  entryPrice: new BigNumber(entryPrice),
  netFunding: new BigNumber(netFunding),
  assetId: 'BTC',
  marginMode: 'CROSS' as const,
  uniqueId: 'BTC-USD-0' as any,
  value: side === IndexerPositionSide.LONG 
    ? new BigNumber(size).times(entryPrice) 
    : new BigNumber(-size).times(entryPrice),
  adjustedImf: new BigNumber(0.05),
  adjustedMmf: new BigNumber(0.03),
  initialRisk: new BigNumber(size).times(entryPrice).times(0.05),
  maintenanceRisk: new BigNumber(size).times(entryPrice).times(0.03),
  maxLeverage: new BigNumber(20),
  leverage: new BigNumber(10),
  marginValueMaintenance: new BigNumber(5000),
  marginValueInitial: new BigNumber(8000),
  liquidationPrice: new BigNumber(45000),
  updatedUnrealizedPnl: BIG_NUMBERS.ZERO,
  updatedUnrealizedPnlPercent: BIG_NUMBERS.ZERO,
});

describe('Funding Calculator - Core Functions', () => {
  describe('getFundingDirection', () => {
    it('should return PAY for long position with positive funding rate', () => {
      const direction = getFundingDirection(new BigNumber(0.0001), IndexerPositionSide.LONG);
      expect(direction).toBe('PAY');
    });

    it('should return RECEIVE for short position with positive funding rate', () => {
      const direction = getFundingDirection(new BigNumber(0.0001), IndexerPositionSide.SHORT);
      expect(direction).toBe('RECEIVE');
    });

    it('should return RECEIVE for long position with negative funding rate', () => {
      const direction = getFundingDirection(new BigNumber(-0.0001), IndexerPositionSide.LONG);
      expect(direction).toBe('RECEIVE');
    });

    it('should return PAY for short position with negative funding rate', () => {
      const direction = getFundingDirection(new BigNumber(-0.0001), IndexerPositionSide.SHORT);
      expect(direction).toBe('PAY');
    });

    it('should return NEUTRAL for zero funding rate', () => {
      const directionLong = getFundingDirection(new BigNumber(0), IndexerPositionSide.LONG);
      const directionShort = getFundingDirection(new BigNumber(0), IndexerPositionSide.SHORT);
      expect(directionLong).toBe('NEUTRAL');
      expect(directionShort).toBe('NEUTRAL');
    });
  });

  describe('isExtremeFundingRate', () => {
    it('should return true for rates above 1% per hour', () => {
      expect(isExtremeFundingRate(new BigNumber(0.011))).toBe(true);
      expect(isExtremeFundingRate(new BigNumber(-0.011))).toBe(true);
    });

    it('should return false for rates below 1% per hour', () => {
      expect(isExtremeFundingRate(new BigNumber(0.009))).toBe(false);
      expect(isExtremeFundingRate(new BigNumber(-0.005))).toBe(false);
    });

    it('should return false for zero rate', () => {
      expect(isExtremeFundingRate(new BigNumber(0))).toBe(false);
    });
  });

  describe('isHighFundingRate', () => {
    it('should return true for rates between 0.5% and 1% per hour', () => {
      expect(isHighFundingRate(new BigNumber(0.007))).toBe(true);
      expect(isHighFundingRate(new BigNumber(-0.008))).toBe(true);
    });

    it('should return false for extreme rates (above 1%)', () => {
      expect(isHighFundingRate(new BigNumber(0.012))).toBe(false);
    });

    it('should return false for normal rates (below 0.5%)', () => {
      expect(isHighFundingRate(new BigNumber(0.0003))).toBe(false);
    });
  });

  describe('getFundingRateInfo', () => {
    it('should return correct info for market with funding rate', () => {
      const market = createMockMarket(0.0001);
      const info = getFundingRateInfo(market, IndexerPositionSide.LONG);
      
      expect(info.rate.toNumber()).toBe(0.0001);
      expect(info.direction).toBe('PAY');
      expect(info.isExtreme).toBe(false);
    });

    it('should return zero rate for undefined market', () => {
      const info = getFundingRateInfo(undefined, IndexerPositionSide.LONG);
      
      expect(info.rate.toNumber()).toBe(0);
      expect(info.direction).toBe('NEUTRAL');
      expect(info.isExtreme).toBe(false);
    });
  });
});

describe('Funding Calculator - Cost Calculations', () => {
  describe('calculateFundingCost', () => {
    it('should calculate funding cost correctly for 24 hours', () => {
      // Position: 1 BTC at $50,000 = $50,000 notional
      // Rate: 0.01% per hour
      // Hours: 24
      // Expected: 50,000 * 0.0001 * 24 = $120
      const cost = calculateFundingCost(
        new BigNumber(50000),
        new BigNumber(0.0001),
        24
      );
      
      expect(cost.toNumber()).toBeCloseTo(120, 6);
    });

    it('should calculate funding cost correctly for 8 hours', () => {
      // Position: 1 BTC at $50,000 = $50,000 notional
      // Rate: 0.01% per hour
      // Hours: 8
      // Expected: 50,000 * 0.0001 * 8 = $40
      const cost = calculateFundingCost(
        new BigNumber(50000),
        new BigNumber(0.0001),
        8
      );
      
      expect(cost.toNumber()).toBeCloseTo(40, 6);
    });

    it('should handle negative funding rates', () => {
      const cost = calculateFundingCost(
        new BigNumber(50000),
        new BigNumber(-0.0001),
        24
      );
      
      expect(cost.toNumber()).toBeCloseTo(-120, 6);
    });

    it('should return zero for zero position size', () => {
      const cost = calculateFundingCost(
        new BigNumber(0),
        new BigNumber(0.0001),
        24
      );
      
      expect(cost.toNumber()).toBe(0);
    });

    it('should return zero for zero funding rate', () => {
      const cost = calculateFundingCost(
        new BigNumber(50000),
        new BigNumber(0),
        24
      );
      
      expect(cost.toNumber()).toBe(0);
    });

    it('should maintain accuracy to 6 decimal places', () => {
      const cost = calculateFundingCost(
        new BigNumber(123.456789),
        new BigNumber(0.000123),
        17
      );
      
      // Should be rounded to 6 decimal places
      expect(cost.decimalPlaces()).toBeLessThanOrEqual(6);
    });
  });

  describe('calculateFundingCosts', () => {
    it('should calculate all time period costs correctly', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const costs = calculateFundingCosts(position, market);
      
      expect(costs.hourlyRate.toNumber()).toBe(0.0001);
      expect(costs.per8HourRate.toNumber()).toBe(0.0008);
      expect(costs.dailyRate.toNumber()).toBe(0.0024);
      expect(costs.direction).toBe('PAY');
      
      expect(costs.hourlyCost.toNumber()).toBeCloseTo(5, 6);
      expect(costs.per8HourCost.toNumber()).toBeCloseTo(40, 6);
      expect(costs.dailyCost.toNumber()).toBeCloseTo(120, 6);
    });

    it('should handle short positions correctly', () => {
      const position = createMockPosition(IndexerPositionSide.SHORT, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const costs = calculateFundingCosts(position, market);
      
      expect(costs.direction).toBe('RECEIVE');
    });

    it('should handle undefined market', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      
      const costs = calculateFundingCosts(position, undefined);
      
      expect(costs.hourlyCost.toNumber()).toBe(0);
      expect(costs.dailyCost.toNumber()).toBe(0);
      expect(costs.direction).toBe('NEUTRAL');
    });
  });

  describe('calculateFundingCostSafe', () => {
    it('should calculate normally for valid inputs', () => {
      const result = calculateFundingCostSafe(
        new BigNumber(50000),
        new BigNumber(0.0001),
        24
      );
      
      expect(result.overflow).toBe(false);
      expect(result.cost.toNumber()).toBeCloseTo(120, 6);
    });

    it('should detect overflow for unreasonable values', () => {
      const result = calculateFundingCostSafe(
        new BigNumber(50000),
        new BigNumber(0.0001),
        24,
        new BigNumber(100) // max cost
      );
      
      expect(result.overflow).toBe(true);
      expect(result.cost.toNumber()).toBe(100);
    });

    it('should handle infinite values gracefully', () => {
      const result = calculateFundingCostSafe(
        new BigNumber(Infinity),
        new BigNumber(0.0001),
        24
      );
      
      expect(result.overflow).toBe(true);
    });
  });
});

describe('Funding Calculator - Projections', () => {
  describe('calculateFundingProjections', () => {
    it('should calculate 1-day, 7-day, and 30-day projections', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const projections = calculateFundingProjections(position, market);
      
      // 1 day: 50,000 * 0.0001 * 24 = $120
      expect(projections.oneDay.estimatedCost.toNumber()).toBeCloseTo(120, 6);
      expect(projections.oneDay.periodHours).toBe(24);
      expect(projections.oneDay.period).toBe('1d');
      
      // 7 days: 50,000 * 0.0001 * 24 * 7 = $840
      expect(projections.sevenDays.estimatedCost.toNumber()).toBeCloseTo(840, 6);
      expect(projections.sevenDays.periodHours).toBe(24 * 7);
      expect(projections.sevenDays.period).toBe('7d');
      
      // 30 days: 50,000 * 0.0001 * 24 * 30 = $3,600
      expect(projections.thirtyDays.estimatedCost.toNumber()).toBeCloseTo(3600, 6);
      expect(projections.thirtyDays.periodHours).toBe(24 * 30);
      expect(projections.thirtyDays.period).toBe('30d');
      
      // Cost per day should be same for all projections
      expect(projections.oneDay.costPerDay.toNumber()).toBeCloseTo(120, 6);
      expect(projections.sevenDays.costPerDay.toNumber()).toBeCloseTo(120, 6);
      expect(projections.thirtyDays.costPerDay.toNumber()).toBeCloseTo(120, 6);
    });

    it('should handle negative funding rates', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(-0.0001);
      
      const projections = calculateFundingProjections(position, market);
      
      expect(projections.oneDay.estimatedCost.toNumber()).toBeCloseTo(-120, 6);
      expect(projections.oneDay.direction).toBe('RECEIVE');
    });
  });
});

describe('Funding Calculator - Break-Even Analysis', () => {
  describe('calculateBreakEvenWithFunding', () => {
    it('should calculate break-even correctly for long position with positive funding', () => {
      // Long 1 BTC at $50,000
      // Funding rate: 0.01% per hour (paying)
      // 1 day funding cost: $120
      // Break-even with funding: $50,000 + ($120 / 1) = $50,120
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const breakEven = calculateBreakEvenWithFunding(position, market);
      
      expect(breakEven.baseBreakEven.toNumber()).toBe(50000);
      expect(breakEven.fundingImpact1d.toNumber()).toBeCloseTo(120, 6);
      expect(breakEven.breakEvenWithFunding1d.toNumber()).toBeCloseTo(50120, 6);
      expect(breakEven.breakEvenWithFunding7d.toNumber()).toBeCloseTo(50840, 6);
      expect(breakEven.breakEvenWithFunding30d.toNumber()).toBeCloseTo(53600, 6);
    });

    it('should calculate break-even correctly for short position with positive funding', () => {
      // Short 1 BTC at $50,000
      // Funding rate: 0.01% per hour (receiving)
      // 1 day funding received: $120
      // Break-even with funding: $50,000 - ($120 / 1) = $49,880
      const position = createMockPosition(IndexerPositionSide.SHORT, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const breakEven = calculateBreakEvenWithFunding(position, market);
      
      expect(breakEven.baseBreakEven.toNumber()).toBe(50000);
      expect(breakEven.fundingImpact1d.toNumber()).toBeCloseTo(120, 6);
      expect(breakEven.breakEvenWithFunding1d.toNumber()).toBeCloseTo(49880, 6);
    });

    it('should calculate break-even correctly with negative funding rate', () => {
      // Long 1 BTC at $50,000
      // Funding rate: -0.01% per hour (receiving)
      // 1 day funding received: $120
      // Break-even with funding: $50,000 - ($120 / 1) = $49,880
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(-0.0001);
      
      const breakEven = calculateBreakEvenWithFunding(position, market);
      
      expect(breakEven.fundingImpact1d.toNumber()).toBeCloseTo(-120, 6);
      expect(breakEven.breakEvenWithFunding1d.toNumber()).toBeCloseTo(49880, 6);
    });

    it('should handle zero funding rate', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0);
      
      const breakEven = calculateBreakEvenWithFunding(position, market);
      
      expect(breakEven.fundingImpact1d.toNumber()).toBe(0);
      expect(breakEven.breakEvenWithFunding1d.toNumber()).toBe(50000);
    });
  });
});

describe('Funding Calculator - Trade Funding Cost', () => {
  describe('calculateTradeFundingCost', () => {
    it('should calculate funding cost for potential trade', () => {
      const market = createMockMarket(0.0001);
      
      const result = calculateTradeFundingCost(
        new BigNumber(1), // 1 BTC
        new BigNumber(50000), // at $50,000
        IndexerPositionSide.LONG,
        market,
        24 // 24 hours
      );
      
      expect(result.cost.toNumber()).toBeCloseTo(120, 6);
      expect(result.direction).toBe('PAY');
      expect(result.costPercentage.toNumber()).toBeCloseTo(0.24, 6); // 0.24% of position
    });

    it('should handle short positions', () => {
      const market = createMockMarket(0.0001);
      
      const result = calculateTradeFundingCost(
        new BigNumber(2),
        new BigNumber(50000),
        IndexerPositionSide.SHORT,
        market,
        24
      );
      
      expect(result.cost.toNumber()).toBeCloseTo(240, 6);
      expect(result.direction).toBe('RECEIVE');
    });
  });
});

describe('Funding Calculator - Complete Analysis', () => {
  describe('calculateCompleteFundingAnalysis', () => {
    it('should provide complete funding analysis', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const analysis = calculateCompleteFundingAnalysis(position, market);
      
      // Rate info
      expect(analysis.rateInfo.rate.toNumber()).toBe(0.0001);
      expect(analysis.rateInfo.direction).toBe('PAY');
      expect(analysis.rateInfo.isExtreme).toBe(false);
      
      // Costs
      expect(analysis.costs.dailyCost.toNumber()).toBeCloseTo(120, 6);
      
      // Projections
      expect(analysis.projections.oneDay.estimatedCost.toNumber()).toBeCloseTo(120, 6);
      expect(analysis.projections.sevenDays.estimatedCost.toNumber()).toBeCloseTo(840, 6);
      
      // Break-even
      expect(analysis.breakEven.breakEvenWithFunding1d.toNumber()).toBeCloseTo(50120, 6);
      
      // Warnings
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.warnings.some(w => w.includes('PAY'))).toBe(true);
    });

    it('should generate warnings for extreme funding rates', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.015); // 1.5% per hour - extreme!
      
      const analysis = calculateCompleteFundingAnalysis(position, market);
      
      expect(analysis.rateInfo.isExtreme).toBe(true);
      expect(analysis.warnings.some(w => w.includes('EXTREME'))).toBe(true);
    });

    it('should generate warnings for high daily costs', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.01); // 1% per hour
      
      const analysis = calculateCompleteFundingAnalysis(position, market);
      
      // Daily cost: 50,000 * 0.01 * 24 = $12,000 (24% of position)
      expect(analysis.warnings.some(w => w.includes('daily funding cost'))).toBe(true);
    });
  });
});

describe('Funding Calculator - Historical Analysis', () => {
  describe('calculateFundingCostRange', () => {
    it('should calculate cost range based on historical data', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const historicalRates = [
        { rate: 0.0001, timestamp: Date.now() - 86400000 },
        { rate: 0.00012, timestamp: Date.now() - 172800000 },
        { rate: 0.00008, timestamp: Date.now() - 259200000 },
        { rate: 0.0001, timestamp: Date.now() - 345600000 },
        { rate: 0.00011, timestamp: Date.now() - 432000000 },
      ];
      
      const range = calculateFundingCostRange(position, market, historicalRates);
      
      expect(range.current.toNumber()).toBeCloseTo(120, 6);
      expect(range.average).toBeDefined();
      expect(range.optimistic).toBeDefined();
      expect(range.pessimistic).toBeDefined();
      
      // Pessimistic should be higher than optimistic
      expect(range.pessimistic.abs().toNumber()).toBeGreaterThan(
        range.optimistic.abs().toNumber()
      );
    });

    it('should fallback to current rate when no historical data', () => {
      const position = createMockPosition(IndexerPositionSide.LONG, 1, 50000) as SubaccountPosition;
      const market = createMockMarket(0.0001);
      
      const range = calculateFundingCostRange(position, market, []);
      
      expect(range.current.toNumber()).toBeCloseTo(120, 6);
      expect(range.average.toNumber()).toBeCloseTo(120, 6);
      expect(range.optimistic.toNumber()).toBeCloseTo(120, 6);
      expect(range.pessimistic.toNumber()).toBeCloseTo(120, 6);
    });
  });
});

