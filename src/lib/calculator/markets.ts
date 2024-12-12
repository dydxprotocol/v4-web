import { getFractionDigits } from '../numbers';

/**
 *
 * @param tickSize perpetual market's tick size
 * @returns number of decimal places in the tickSize
 */
export const getTickSizeDecimals = (tickSize: string): number => {
  return getFractionDigits(tickSize);
};

/**
 *
 * @param stepSize perpetual market's tick size
 * @returns number of decimal places in the tickSize
 */
export const getStepSizeDecimals = (stepSize: string): number => {
  return getFractionDigits(stepSize);
};
