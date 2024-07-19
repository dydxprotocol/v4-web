import { MarketConfigs } from '@/constants/abacus';

import { BIG_NUMBERS } from './numbers';

export function calculateMarketMaxLeverage({
  effectiveInitialMarginFraction,
  initialMarginFraction,
}: Pick<MarketConfigs, 'effectiveInitialMarginFraction' | 'initialMarginFraction'>) {
  if (effectiveInitialMarginFraction) {
    return BIG_NUMBERS.ONE.div(effectiveInitialMarginFraction).toNumber();
  }

  if (initialMarginFraction) {
    return BIG_NUMBERS.ONE.div(initialMarginFraction).toNumber();
  }

  return 10; // default
}
