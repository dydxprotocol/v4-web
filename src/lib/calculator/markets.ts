import { PERCENT_DECIMALS } from '@/constants/numbers';

import { isTruthy } from '../isTruthy';
import { BigNumberish, getFractionDigits, MustBigNumber } from '../numbers';

/**
 *
 * @param tickSize perpetual market's tick size
 * @returns number of decimal places in the tickSize
 */
export const getTickSizeDecimals = (tickSize: BigNumberish): number => {
  return getFractionDigits(tickSize);
};

/**
 *
 * @param stepSize perpetual market's tick size
 * @returns number of decimal places in the tickSize
 */
export const getStepSizeDecimals = (stepSize: BigNumberish): number => {
  return getFractionDigits(stepSize);
};

/**
 *
 * @param priceChange24H perpetual market's 24h price change
 * @param oraclePrice perpetual market's oracle price
 * @returns percent change in the perpetual market's price over the last 24 hours
 */
export const get24hPriceChangePercent = ({
  priceChange24H,
  oraclePrice,
}: {
  priceChange24H: BigNumberish;
  oraclePrice: BigNumberish;
}): string | undefined => {
  if (isTruthy(oraclePrice)) {
    return MustBigNumber(priceChange24H).div(oraclePrice).toFixed(PERCENT_DECIMALS);
  }

  return undefined;
};
