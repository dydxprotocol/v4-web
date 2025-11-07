import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAppSelector } from '@/state/appTypes';

import {
    calculateBreakEvenWithFunding,
    calculateCompleteFundingAnalysis,
    calculateFundingCosts,
    calculateFundingProjections,
    calculateTradeFundingCost,
    getFundingRateInfo,
    type BreakEvenWithFunding,
    type CompleteFundingAnalysis,
    type FundingCostCalculation,
    type FundingProjections,
    type FundingRateInfo,
} from '../calculators/fundingCalculations';
import { BonsaiCore, BonsaiHelpers } from '../ontology';
import type { MarketInfo, SubaccountPosition } from '../types/summaryTypes';

export function useFundingRateInfo(position: SubaccountPosition | undefined): FundingRateInfo | undefined {
  const markets = useAppSelector(BonsaiCore.markets.markets.data);
  
  return useMemo(() => {
    if (!position || !markets) return undefined;
    
    const market = markets[position.market];
    return getFundingRateInfo(market, position.side);
  }, [position, markets]);
}

export function useFundingCosts(
  position: SubaccountPosition | undefined
): FundingCostCalculation | undefined {
  const markets = useAppSelector(BonsaiCore.markets.markets.data);
  
  return useMemo(() => {
    if (!position || !markets) return undefined;
    
    const market = markets[position.market];
    return calculateFundingCosts(position, market);
  }, [position, markets]);
}

export function useFundingProjections(
  position: SubaccountPosition | undefined
): FundingProjections | undefined {
  const markets = useAppSelector(BonsaiCore.markets.markets.data);
  
  return useMemo(() => {
    if (!position || !markets) return undefined;
    
    const market = markets[position.market];
    return calculateFundingProjections(position, market);
  }, [position, markets]);
}

export function useBreakEvenWithFunding(
  position: SubaccountPosition | undefined
): BreakEvenWithFunding | undefined {
  const markets = useAppSelector(BonsaiCore.markets.markets.data);
  
  return useMemo(() => {
    if (!position || !markets) return undefined;
    
    const market = markets[position.market];
    return calculateBreakEvenWithFunding(position, market);
  }, [position, markets]);
}

export function useCompleteFundingAnalysis(
  position: SubaccountPosition | undefined
): CompleteFundingAnalysis | undefined {
  const markets = useAppSelector(BonsaiCore.markets.markets.data);
  
  return useMemo(() => {
    if (!position || !markets) return undefined;
    
    const market = markets[position.market];
    return calculateCompleteFundingAnalysis(position, market);
  }, [position, markets]);
}

export function useAllPositionsFundingAnalysis(): Map<string, CompleteFundingAnalysis> {
  const positions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  const markets = useAppSelector(BonsaiCore.markets.markets.data);
  
  return useMemo(() => {
    const analysisMap = new Map<string, CompleteFundingAnalysis>();
    
    if (!positions || !markets) return analysisMap;
    
    positions.forEach((position) => {
      const market = markets[position.market];
      const analysis = calculateCompleteFundingAnalysis(position, market);
      analysisMap.set(position.uniqueId, analysis);
    });
    
    return analysisMap;
  }, [positions, markets]);
}

export function useCurrentMarketFundingRate(): {
  market: MarketInfo | undefined;
  fundingRatePerHour: number | undefined;
  fundingRatePer8Hours: number | undefined;
  fundingRatePerDay: number | undefined;
} {
  const market = useAppSelector(BonsaiHelpers.currentMarket.marketInfo);
  
  return useMemo(() => {
    const fundingRatePerHour = market?.nextFundingRate != null 
      ? Number(market.nextFundingRate) 
      : undefined;
    
    return {
      market,
      fundingRatePerHour,
      fundingRatePer8Hours: fundingRatePerHour != null ? fundingRatePerHour * 8 : undefined,
      fundingRatePerDay: fundingRatePerHour != null ? fundingRatePerHour * 24 : undefined,
    };
  }, [market]);
}

export function useTradeFundingCost(params: {
  size?: number;
  price?: number;
  side?: 'LONG' | 'SHORT';
  hours?: number;
}) {
  const { size, price, side, hours = 24 } = params;
  const { market } = useCurrentMarketFundingRate();
  
  return useMemo(() => {
    if (size == null || price == null || side == null || !market) {
      return {
        cost: undefined,
        direction: undefined,
        costPercentage: undefined,
        costPer8Hours: undefined,
        costPerDay: undefined,
      };
    }
    
    const result = calculateTradeFundingCost(
      new BigNumber(size),
      new BigNumber(price),
      side === 'LONG' ? IndexerPositionSide.LONG : IndexerPositionSide.SHORT,
      market,
      hours
    );
    
    const costPer8Hours = calculateTradeFundingCost(
      new BigNumber(size),
      new BigNumber(price),
      side === 'LONG' ? IndexerPositionSide.LONG : IndexerPositionSide.SHORT,
      market,
      8
    );
    
    const costPerDay = calculateTradeFundingCost(
      new BigNumber(size),
      new BigNumber(price),
      side === 'LONG' ? IndexerPositionSide.LONG : IndexerPositionSide.SHORT,
      market,
      24
    );
    
    return {
      cost: result.cost.toNumber(),
      direction: result.direction,
      costPercentage: result.costPercentage.toNumber(),
      costPer8Hours: costPer8Hours.cost.toNumber(),
      costPerDay: costPerDay.cost.toNumber(),
    };
  }, [size, price, side, hours, market]);
}

export function useAggregateFundingInfo(): {
  totalDailyFundingCost: number;
  totalPositionsPaying: number;
  totalPositionsReceiving: number;
  hasExtremeRates: boolean;
  positionsWithWarnings: number;
} {
  const analysisMap = useAllPositionsFundingAnalysis();
  
  return useMemo(() => {
    let totalDailyFundingCost = 0;
    let totalPositionsPaying = 0;
    let totalPositionsReceiving = 0;
    let hasExtremeRates = false;
    let positionsWithWarnings = 0;
    
    analysisMap.forEach((analysis) => {
      const dailyCost = analysis.costs.dailyCost.toNumber();
      totalDailyFundingCost += dailyCost;
      
      if (analysis.costs.direction === 'PAY') {
        totalPositionsPaying++;
      } else if (analysis.costs.direction === 'RECEIVE') {
        totalPositionsReceiving++;
      }
      
      if (analysis.rateInfo.isExtreme) {
        hasExtremeRates = true;
      }
      
      if (analysis.warnings.length > 0) {
        positionsWithWarnings++;
      }
    });
    
    return {
      totalDailyFundingCost,
      totalPositionsPaying,
      totalPositionsReceiving,
      hasExtremeRates,
      positionsWithWarnings,
    };
  }, [analysisMap]);
}

