import { RatioOutput } from '@sdk/shared/models/decimals';
import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import type { MarketConfigEntity } from '../..';

export const calculateMaxLeverage = (marketConfig: MarketConfigEntity): RatioOutput => {
  const imfDecimal = marketConfig.initialMarginFraction;
  if (imfDecimal.value === '0') {
    return zero(RatioOutput);
  }

  return DecimalCalculator.value(RatioOutput.fromFloat(1))
    .divideBy(imfDecimal)
    .calculate(RatioOutput);
};
