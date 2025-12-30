import { RatioOutput } from '@/shared/models/decimals';
import type { MarketConfigId } from '@/shared/types';
import { DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import type { MarketQueries } from '../../markets';

export interface CalculateMaxLeverageDependencies {
  marketQueries: MarketQueries;
}

export const createCalculateMaxLeverage =
  (deps: CalculateMaxLeverageDependencies) =>
  (marketConfigId: MarketConfigId): RatioOutput => {
    const marketConfig = deps.marketQueries.getMarketConfigById(marketConfigId);
    const imfDecimal = marketConfig.initialMarginFraction;
    if (imfDecimal.toBigInt() === 0n) {
      return zero(RatioOutput);
    }

    return DecimalCalculator.value(RatioOutput.fromFloat(1))
      .divideBy(imfDecimal)
      .calculate(RatioOutput);
  };
