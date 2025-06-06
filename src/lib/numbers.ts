import { BigNumber } from 'bignumber.js';

import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';

export type BigNumberish = BigNumber | string | number;
export type LocaleSeparators = { group?: string; decimal?: string };
export const MAX_INT_ROUGHLY = 2e9;

export const BIG_NUMBERS = {
  ZERO: new BigNumber(0),
  ONE: new BigNumber(1),
  TEN: new BigNumber(10),
};

// defaults to zero if null or empty
export const MustBigNumber = (amount?: BigNumberish | null): BigNumber =>
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  new BigNumber(amount || 0);

// undefined if falsey otherwise a valid bignumber
export const MaybeBigNumber = (amount?: BigNumberish | null): BigNumber | undefined => {
  if (amount == null) {
    return undefined;
  }
  if (amount === '') {
    return undefined;
  }
  if (typeof amount === 'number' && Number.isNaN(amount)) {
    return undefined;
  }
  if (BigNumber.isBigNumber(amount) && !amount.isFinite()) {
    return undefined;
  }
  return MustBigNumber(amount);
};

export const MaybeNumber = (amount?: BigNumberish | null): number | undefined =>
  MaybeBigNumber(amount)?.toNumber();

export const MustNumber = (amount?: BigNumberish | null): number =>
  MustBigNumber(amount).toNumber();

// doesnt allow null, always returns big number
// empty string becomes null though
export const ToBigNumber = (amount: BigNumberish): BigNumber => {
  return MustBigNumber(amount);
};

export const ToNumber = (amount: string): number => {
  return ToBigNumber(amount).toNumber();
};

// returns undefined if it's not parseable, otherwise a valid bignumber
export const AttemptBigNumber = (
  amount: string | number | undefined | null | BigNumber
): BigNumber | undefined => {
  if (amount == null) {
    return undefined;
  }
  const bn = new BigNumber(amount);
  if (!bn.isFinite()) {
    return undefined;
  }
  return bn;
};

export const AttemptNumber = (amount: string | number | undefined | null): number | undefined => {
  return AttemptBigNumber(amount)?.toNumber();
};

export const clampBn = (n: BigNumber, min: BigNumber, max: BigNumber) =>
  BigNumber.max(min, BigNumber.min(max, n));

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

export const getFractionDigits = (unit?: BigNumberish | null) =>
  // n?.toString().match(/[.](\d*)/)?.[1].length ?? 0
  unit ? Math.max(Math.ceil(-Math.log10(Math.abs(+unit))), 0) : 0;

export const getTickSizeFromPrice = (price: BigNumberish) => {
  const priceNum = MustBigNumber(price).toNumber();
  const p = Math.floor(Math.log10(priceNum));
  const subticksPerTickLog10 = Math.log10(10 ** (9 - 3));
  const quantumConversionExponent = -9;
  const exponent = p + quantumConversionExponent + subticksPerTickLog10;
  return exponent < 0 ? 1 / 10 ** Math.abs(exponent) : 10 ** exponent;
};

export const getTickSizeDecimalsFromPrice = (price?: BigNumberish | null) => {
  if (!price) return TOKEN_DECIMALS;
  const tickSize = getTickSizeFromPrice(price);
  return getFractionDigits(tickSize);
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
    .find((part) => part.type === separatorType)?.value;

/**
 * Converts a byte array (representing an arbitrary-size signed integer) into a bigint.
 * @param u Array of bytes represented as a Uint8Array.
 */
export function bytesToBigInt(u: Uint8Array): bigint {
  if (u.length <= 1) {
    return BigInt(0);
  }
  // eslint-disable-next-line no-bitwise
  const negated: boolean = (u[0]! & 1) === 1;
  const hex: string = Buffer.from(u.slice(1)).toString('hex');
  const abs: bigint = BigInt(`0x${hex}`);
  return negated ? -abs : abs;
}

export const getNumberSign = (
  n: BigNumberish | null | undefined,
  toleranceTowardZero: number = 0
): NumberSign =>
  MustBigNumber(n).gt(0 + toleranceTowardZero)
    ? NumberSign.Positive
    : MustBigNumber(n).lt(0 - toleranceTowardZero)
      ? NumberSign.Negative
      : NumberSign.Neutral;

export const nullIfZero = (n?: number | string | null) => (MustBigNumber(n).eq(0) ? null : n);

export function toStepSize(val: number | BigNumber, marketStepSize: number) {
  return MustBigNumber(val)
    .div(marketStepSize)
    .decimalPlaces(0, BigNumber.ROUND_HALF_DOWN)
    .times(marketStepSize)
    .toNumber();
}
