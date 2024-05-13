import { BigNumber } from 'bignumber.js';

import { NumberSign } from '@/constants/numbers';

export type BigNumberish = BigNumber | string | number;
export type LocaleSeparators = { group?: string; decimal?: string };

export const BIG_NUMBERS = {
  ZERO: new BigNumber(0),
  ONE: new BigNumber(1),
};

export const MustBigNumber = (amount?: BigNumberish | null): BigNumber =>
  new BigNumber(amount || 0);

/**
 * @description Rounds the input to the nearest multiple of `factor`, which must be non-zero.
 */
export const roundToNearestFactor = ({
  number,
  factor,
  roundingMode = BigNumber.ROUND_UP,
}: {
  number: BigNumberish;
  factor: number;
  roundingMode: BigNumber.RoundingMode;
}): BigNumber => {
  if (factor === 0) throw Error('Invalid dividend');

  return MustBigNumber(number).div(factor).decimalPlaces(0, roundingMode).times(factor);
};

export const getFractionDigits = (unit?: BigNumber | number | string | null) =>
  // n?.toString().match(/[.](\d*)/)?.[1].length ?? 0
  unit ? Math.max(Math.ceil(-Math.log10(Math.abs(+unit))), 0) : 0;

/**
 * @description Rounds the input to the nearest multiple of `tick`, which must be non-zero.
 */
export const roundToTick = ({ num, tick }: { num: number; tick: number }): number => {
  if (tick === 0) {
    throw Error('Invalid dividend');
  }
  const absTick: number = Math.abs(tick);
  return Math.round(num / absTick) * absTick;
};

export const isNumber = (value: any): value is number =>
  typeof value === 'number' && !Number.isNaN(value);

/**
 * @description Returns null if input is 0 or null, '99+' if input is greater than 99, otherwise original input number
 */
export const shortenNumberForDisplay = (num?: number) =>
  MustBigNumber(num).eq(0) ? null : MustBigNumber(num).gt(99) ? '99+' : num;

/**
 * @param locale - locale to use for formatting (optional)
 * @param separatorType - type of separator to get (group or decimal)
 * @returns separator for the given locale and separator type
 */
export const getSeparator = ({
  browserLanguage = navigator.language || 'en-US',
  separatorType,
}: {
  browserLanguage?: string;
  separatorType: Intl.NumberFormatPartTypes;
}) =>
  Intl.NumberFormat(browserLanguage)
    .formatToParts(1000.1)
    .find?.((part) => part.type === separatorType)?.value;

/**
 * Converts a byte array (representing an arbitrary-size signed integer) into a bigint.
 * @param u Array of bytes represented as a Uint8Array.
 */
export function bytesToBigInt(u: Uint8Array): bigint {
  if (u.length <= 1) {
    return BigInt(0);
  }
  const negated: boolean = (u[0] & 1) === 1;
  const hex: string = Buffer.from(u.slice(1)).toString('hex');
  const abs: bigint = BigInt(`0x${hex}`);
  return negated ? -abs : abs;
}

export const getNumberSign = (n: any): NumberSign =>
  MustBigNumber(n).gt(0)
    ? NumberSign.Positive
    : MustBigNumber(n).lt(0)
    ? NumberSign.Negative
    : NumberSign.Neutral;
