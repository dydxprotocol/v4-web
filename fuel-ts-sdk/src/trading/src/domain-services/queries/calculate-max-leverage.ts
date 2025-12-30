import { RatioOutput } from '@/shared/models/decimals';
import { MarketConfigId } from '@/shared/types';
import { DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import { MarketQueries } from '../../markets';

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
