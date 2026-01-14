import { UsdValue } from '@/shared/models/decimals';
import { DecimalCalculator } from '@/shared/utils/DecimalCalculator';
import type { MarketConfigEntity } from '../MarketConfigEntity';

export const calculateInitialMargin = (
  marketConfig: MarketConfigEntity,
  notional: UsdValue
): UsdValue => {
  return DecimalCalculator.value(notional)
    .multiplyBy(marketConfig.initialMarginFraction)
    .calculate(UsdValue);
};
