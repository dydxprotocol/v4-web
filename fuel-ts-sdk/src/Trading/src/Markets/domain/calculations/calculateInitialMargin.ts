import { UsdValue } from '@sdk/shared/models/decimals';
import { DecimalCalculator } from '@sdk/shared/utils/DecimalCalculator';
import type { MarketConfigEntity } from '../MarketConfigEntity';

export const calculateInitialMargin = (
  marketConfig: MarketConfigEntity,
  notional: UsdValue
): UsdValue => {
  return DecimalCalculator.value(notional)
    .multiplyBy(marketConfig.initialMarginFraction)
    .calculate(UsdValue);
};
