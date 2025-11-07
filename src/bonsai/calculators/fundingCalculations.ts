import BigNumber from 'bignumber.js';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS } from '@/lib/numbers';

import type { MarketInfo, SubaccountPosition } from '../types/summaryTypes';

export type FundingDirection = 'PAY' | 'RECEIVE' | 'NEUTRAL';

export interface FundingRateInfo {
  rate: BigNumber;
  direction: FundingDirection;
  isExtreme: boolean;
}

export interface FundingCostCalculation {
  hourlyRate: BigNumber;
  dailyRate: BigNumber;
  per8HourRate: BigNumber;
  direction: FundingDirection;
  hourlyCost: BigNumber;
  dailyCost: BigNumber;
  per8HourCost: BigNumber;
}

export interface FundingProjection {
  period: '1d' | '7d' | '30d';
  periodHours: number;
  estimatedCost: BigNumber;
  costPerDay: BigNumber;
  direction: FundingDirection;
}

export interface FundingProjections {
  oneDay: FundingProjection;
  sevenDays: FundingProjection;
  thirtyDays: FundingProjection;
}

export interface BreakEvenWithFunding {
  baseBreakEven: BigNumber;
  breakEvenWithFunding1d: BigNumber;
  breakEvenWithFunding7d: BigNumber;
  breakEvenWithFunding30d: BigNumber;
  fundingImpact1d: BigNumber;
  fundingImpact7d: BigNumber;
  fundingImpact30d: BigNumber;
}

export interface CompleteFundingAnalysis {
  rateInfo: FundingRateInfo;
  costs: FundingCostCalculation;
  projections: FundingProjections;
  breakEven: BreakEvenWithFunding;
  warnings: string[];
}

const HOURS_PER_DAY = 24;
const HOURS_PER_8H_PERIOD = 8;
const EXTREME_FUNDING_RATE_THRESHOLD = 0.01;
const HIGH_FUNDING_RATE_THRESHOLD = 0.005;
const FUNDING_RATE_PRECISION = 6;

export function getFundingDirection(
  fundingRate: BigNumber,
  positionSide: IndexerPositionSide
): FundingDirection {
  if (fundingRate.isZero()) {
    return 'NEUTRAL';
  }

  const isPositiveRate = fundingRate.isPositive();
  const isLong = positionSide === IndexerPositionSide.LONG;

  if ((isPositiveRate && isLong) || (!isPositiveRate && !isLong)) {
    return 'PAY';
  }

  return 'RECEIVE';
}

export function isExtremeFundingRate(fundingRatePerHour: BigNumber): boolean {
  return fundingRatePerHour.abs().gte(EXTREME_FUNDING_RATE_THRESHOLD);
}

export function isHighFundingRate(fundingRatePerHour: BigNumber): boolean {
  return (
    fundingRatePerHour.abs().gte(HIGH_FUNDING_RATE_THRESHOLD) &&
    !isExtremeFundingRate(fundingRatePerHour)
  );
}

export function getFundingRateInfo(
  market: MarketInfo | undefined,
  positionSide: IndexerPositionSide
): FundingRateInfo {
  const fundingRate = market?.nextFundingRate != null 
    ? new BigNumber(market.nextFundingRate)
    : BIG_NUMBERS.ZERO;

  return {
    rate: fundingRate,
    direction: getFundingDirection(fundingRate, positionSide),
    isExtreme: isExtremeFundingRate(fundingRate),
  };
}

export function calculateFundingCost(
  positionSize: BigNumber,
  fundingRatePerHour: BigNumber,
  hours: number
): BigNumber {
  if (positionSize.isZero() || fundingRatePerHour.isZero()) {
    return BIG_NUMBERS.ZERO;
  }

  const cost = positionSize.times(fundingRatePerHour).times(hours);

  return cost.decimalPlaces(FUNDING_RATE_PRECISION);
}

export function calculateFundingCosts(
  position: SubaccountPosition,
  market: MarketInfo | undefined
): FundingCostCalculation {
  const fundingRate = market?.nextFundingRate != null
    ? new BigNumber(market.nextFundingRate)
    : BIG_NUMBERS.ZERO;

  const positionNotional = position.notional;
  const direction = getFundingDirection(fundingRate, position.side);

  const per8HourRate = fundingRate.times(HOURS_PER_8H_PERIOD);
  const dailyRate = fundingRate.times(HOURS_PER_DAY);

  const hourlyCost = calculateFundingCost(positionNotional, fundingRate, 1);
  const per8HourCost = calculateFundingCost(positionNotional, fundingRate, HOURS_PER_8H_PERIOD);
  const dailyCost = calculateFundingCost(positionNotional, fundingRate, HOURS_PER_DAY);

  return {
    hourlyRate: fundingRate,
    dailyRate,
    per8HourRate,
    direction,
    hourlyCost,
    dailyCost,
    per8HourCost,
  };
}

export function calculateFundingProjections(
  position: SubaccountPosition,
  market: MarketInfo | undefined
): FundingProjections {
  const fundingRate = market?.nextFundingRate != null
    ? new BigNumber(market.nextFundingRate)
    : BIG_NUMBERS.ZERO;

  const positionNotional = position.notional;
  const direction = getFundingDirection(fundingRate, position.side);

  const oneDay: FundingProjection = {
    period: '1d',
    periodHours: 24,
    estimatedCost: calculateFundingCost(positionNotional, fundingRate, 24),
    costPerDay: calculateFundingCost(positionNotional, fundingRate, 24),
    direction,
  };

  const sevenDays: FundingProjection = {
    period: '7d',
    periodHours: 24 * 7,
    estimatedCost: calculateFundingCost(positionNotional, fundingRate, 24 * 7),
    costPerDay: calculateFundingCost(positionNotional, fundingRate, 24),
    direction,
  };

  const thirtyDays: FundingProjection = {
    period: '30d',
    periodHours: 24 * 30,
    estimatedCost: calculateFundingCost(positionNotional, fundingRate, 24 * 30),
    costPerDay: calculateFundingCost(positionNotional, fundingRate, 24),
    direction,
  };

  return {
    oneDay,
    sevenDays,
    thirtyDays,
  };
}

export function calculateBreakEvenWithFunding(
  position: SubaccountPosition,
  market: MarketInfo | undefined
): BreakEvenWithFunding {
  const entryPrice = position.baseEntryPrice;
  const positionSize = position.unsignedSize;
  const fundingRate = market?.nextFundingRate != null
    ? new BigNumber(market.nextFundingRate)
    : BIG_NUMBERS.ZERO;

  const isLong = position.side === IndexerPositionSide.LONG;

  const fundingCost1d = calculateFundingCost(position.notional, fundingRate, 24);
  const fundingCost7d = calculateFundingCost(position.notional, fundingRate, 24 * 7);
  const fundingCost30d = calculateFundingCost(position.notional, fundingRate, 24 * 30);

  const fundingImpact1d = positionSize.isZero()
    ? BIG_NUMBERS.ZERO
    : fundingCost1d.div(positionSize);
  const fundingImpact7d = positionSize.isZero()
    ? BIG_NUMBERS.ZERO
    : fundingCost7d.div(positionSize);
  const fundingImpact30d = positionSize.isZero()
    ? BIG_NUMBERS.ZERO
    : fundingCost30d.div(positionSize);

  const baseBreakEven = entryPrice;

  const breakEvenWithFunding1d = isLong
    ? entryPrice.plus(fundingImpact1d)
    : entryPrice.minus(fundingImpact1d);

  const breakEvenWithFunding7d = isLong
    ? entryPrice.plus(fundingImpact7d)
    : entryPrice.minus(fundingImpact7d);

  const breakEvenWithFunding30d = isLong
    ? entryPrice.plus(fundingImpact30d)
    : entryPrice.minus(fundingImpact30d);

  return {
    baseBreakEven,
    breakEvenWithFunding1d,
    breakEvenWithFunding7d,
    breakEvenWithFunding30d,
    fundingImpact1d,
    fundingImpact7d,
    fundingImpact30d,
  };
}

export function generateFundingWarnings(
  fundingRateInfo: FundingRateInfo,
  costs: FundingCostCalculation,
  position: SubaccountPosition
): string[] {
  const warnings: string[] = [];
  const fundingRate = fundingRateInfo.rate;

  if (isExtremeFundingRate(fundingRate)) {
    const ratePercent = fundingRate.abs().times(100).toFixed(2);
    warnings.push(
      `EXTREME FUNDING RATE: ${ratePercent}% per hour. This position will incur very high funding costs.`
    );
  } else if (isHighFundingRate(fundingRate)) {
    const ratePercent = fundingRate.abs().times(100).toFixed(2);
    warnings.push(
      `High funding rate: ${ratePercent}% per hour. Consider the funding costs in your trading decision.`
    );
  }

  const dailyCostPercent = position.notional.isZero()
    ? BIG_NUMBERS.ZERO
    : costs.dailyCost.abs().div(position.notional).times(100);

  if (dailyCostPercent.gte(5)) {
    warnings.push(
      `High daily funding cost: ${dailyCostPercent.toFixed(2)}% of position size per day.`
    );
  }

  if (fundingRateInfo.direction === 'PAY') {
    const dailyCost = costs.dailyCost.abs();
    warnings.push(
      `You will PAY funding: approximately $${dailyCost.toFixed(2)} per day for this position.`
    );
  }

  return warnings;
}

export function calculateFundingCostSafe(
  positionSize: BigNumber,
  fundingRatePerHour: BigNumber,
  hours: number,
  maxCost?: BigNumber
): { cost: BigNumber; overflow: boolean } {
  try {
    const cost = calculateFundingCost(positionSize, fundingRatePerHour, hours);
    
    if (!cost.isFinite() || (maxCost && cost.abs().gt(maxCost))) {
      return {
        cost: maxCost ?? positionSize,
        overflow: true,
      };
    }

    return {
      cost,
      overflow: false,
    };
  } catch (error) {
    return {
      cost: BIG_NUMBERS.ZERO,
      overflow: true,
    };
  }
}

export function calculateCompleteFundingAnalysis(
  position: SubaccountPosition,
  market: MarketInfo | undefined
): CompleteFundingAnalysis {
  const rateInfo = getFundingRateInfo(market, position.side);
  const costs = calculateFundingCosts(position, market);
  const projections = calculateFundingProjections(position, market);
  const breakEven = calculateBreakEvenWithFunding(position, market);
  const warnings = generateFundingWarnings(rateInfo, costs, position);

  return {
    rateInfo,
    costs,
    projections,
    breakEven,
    warnings,
  };
}

export function calculateTradeFundingCost(
  size: BigNumber,
  price: BigNumber,
  side: IndexerPositionSide,
  market: MarketInfo | undefined,
  hours: number
): {
  cost: BigNumber;
  direction: FundingDirection;
  costPercentage: BigNumber;
} {
  const fundingRate = market?.nextFundingRate != null
    ? new BigNumber(market.nextFundingRate)
    : BIG_NUMBERS.ZERO;

  const notional = size.times(price);
  const cost = calculateFundingCost(notional, fundingRate, hours);
  const direction = getFundingDirection(fundingRate, side);
  const costPercentage = notional.isZero() 
    ? BIG_NUMBERS.ZERO 
    : cost.abs().div(notional).times(100);

  return {
    cost,
    direction,
    costPercentage,
  };
}

export function calculateAverageFundingRate(
  historicalRates: Array<{ rate: string | number; timestamp: number }>
): BigNumber {
  if (historicalRates.length === 0) {
    return BIG_NUMBERS.ZERO;
  }

  const sum = historicalRates.reduce((acc, rate) => {
    return acc.plus(new BigNumber(rate.rate));
  }, BIG_NUMBERS.ZERO);

  return sum.div(historicalRates.length);
}

export function calculateFundingCostRange(
  position: SubaccountPosition,
  market: MarketInfo | undefined,
  historicalRates?: Array<{ rate: string | number; timestamp: number }>
): {
  current: BigNumber;
  optimistic: BigNumber;
  pessimistic: BigNumber;
  average: BigNumber;
} {
  const currentRate = market?.nextFundingRate != null
    ? new BigNumber(market.nextFundingRate)
    : BIG_NUMBERS.ZERO;

  const currentCost = calculateFundingCost(position.notional, currentRate, 24);

  if (!historicalRates || historicalRates.length === 0) {
    return {
      current: currentCost,
      optimistic: currentCost,
      pessimistic: currentCost,
      average: currentCost,
    };
  }

  const rates = historicalRates.map((r) => new BigNumber(r.rate));
  const avgRate = calculateAverageFundingRate(historicalRates);
  
  const variance = rates.reduce((acc, rate) => {
    return acc.plus(rate.minus(avgRate).pow(2));
  }, BIG_NUMBERS.ZERO).div(rates.length);
  
  const stdDev = variance.sqrt();

  const optimisticRate = avgRate.minus(stdDev);
  const pessimisticRate = avgRate.plus(stdDev);

  return {
    current: currentCost,
    optimistic: calculateFundingCost(position.notional, optimisticRate, 24),
    pessimistic: calculateFundingCost(position.notional, pessimisticRate, 24),
    average: calculateFundingCost(position.notional, avgRate, 24),
  };
}

