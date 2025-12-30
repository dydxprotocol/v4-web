import { UsdValue } from '@/shared/models/decimals';
import { MarketConfigId } from '@/shared/types';
import { DecimalCalculator } from '@/shared/utils/decimalCalculator';
import type { MarketQueries } from '../../markets';

export interface CalculateInitialMarginDependencies {
  marketQueries: MarketQueries;
}

export const createCalculateInitialMargin =
  (deps: CalculateInitialMarginDependencies) =>
  (notional: UsdValue, marketConfigId: MarketConfigId): UsdValue => {
    const marketConfig = deps.marketQueries.getMarketConfigById(marketConfigId);
    const imfDecimal = marketConfig.initialMarginFraction;

    return DecimalCalculator.value(notional).multiplyBy(imfDecimal).calculate(UsdValue);
  };
