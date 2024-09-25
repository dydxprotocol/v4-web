import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';

import { getFractionDigits, isNumber, roundToNearestFactor } from '../numbers';

describe('roundToNearestFactor', () => {
  it('should return NaN if given a tick of 0', () => {
    expect(() =>
      roundToNearestFactor({ number: 1.23, factor: 0, roundingMode: BigNumber.ROUND_HALF_CEIL })
    ).toThrow('Invalid dividend');
  });
  it('should return a BigNumber', () => {
    expect(
      roundToNearestFactor({ number: 100, factor: 1, roundingMode: BigNumber.ROUND_HALF_CEIL })
    ).toBeInstanceOf(BigNumber);
  });
  it('should handle strings', () => {
    expect(
      roundToNearestFactor({ number: '100', factor: 3, roundingMode: BigNumber.ROUND_HALF_CEIL })
    ).toEqual(new BigNumber(99));
  });
  it('should handle negative tick', () => {
    expect(
      roundToNearestFactor({ number: 100, factor: -3, roundingMode: BigNumber.ROUND_UP })
    ).toEqual(new BigNumber(102));
  });
  it('should handle negative number', () => {
    expect(
      roundToNearestFactor({ number: -100, factor: 3, roundingMode: BigNumber.ROUND_UP })
    ).toEqual(new BigNumber(-102));
  });
  it('should handle negative number and negative tick', () => {
    expect(
      roundToNearestFactor({ number: -100, factor: -8, roundingMode: BigNumber.ROUND_UP })
    ).toEqual(new BigNumber(-104));
  });

  describe('BigNumber.ROUND_HALF_CEIL', () => {
    it('rounding 100 to a tick of 10 should leave it unchanged', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 1, roundingMode: BigNumber.ROUND_HALF_CEIL })
      ).toEqual(new BigNumber(100));
    });
    it('rounding 100 to a tick of 3 should round down to 99', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 3, roundingMode: BigNumber.ROUND_HALF_CEIL })
      ).toEqual(new BigNumber(99));
    });
    it('rounding 100 to a tick of 8 should round up to 104', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 8, roundingMode: BigNumber.ROUND_HALF_CEIL })
      ).toEqual(new BigNumber(104));
    });
  });

  describe('BigNumber.ROUND_UP', () => {
    it('rounding 100 to a tick of 10 should leave it unchanged', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 1, roundingMode: BigNumber.ROUND_UP })
      ).toEqual(new BigNumber(100));
    });
    it('rounding 100 to a tick of 3 should round up to 99 + 3 = 102', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 3, roundingMode: BigNumber.ROUND_UP })
      ).toEqual(new BigNumber(102));
    });
    it('rounding 100 to a tick of 8 should round up to 96 + 8 = 104', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 8, roundingMode: BigNumber.ROUND_UP })
      ).toEqual(new BigNumber(104));
    });
  });

  describe('BigNumber.ROUND_DOWN', () => {
    it('rounding 100 to a tick of 10 should leave it unchanged', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 1, roundingMode: BigNumber.ROUND_DOWN })
      ).toEqual(new BigNumber(100));
    });
    it('rounding 100 to a tick of 3 should round down to 99', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 3, roundingMode: BigNumber.ROUND_DOWN })
      ).toEqual(new BigNumber(99));
    });
    it('rounding 100 to a tick of 8 should round down to 96', () => {
      expect(
        roundToNearestFactor({ number: 100, factor: 8, roundingMode: BigNumber.ROUND_DOWN })
      ).toEqual(new BigNumber(96));
    });
  });
});

describe('getFractionDigits', () => {
  it('handles integers', () => {
    expect(getFractionDigits(50)).toEqual(0);
  });
  it('handles decimals', () => {
    expect(getFractionDigits(0.005)).toEqual(3);
  });
  it('trims trailing 0s', () => {
    // eslint-disable-next-line prettier/prettier
    expect(getFractionDigits(0.00500)).toEqual(3);
  });
});

describe('isNumber', () => {
  it('handles null', () => {
    expect(isNumber(null)).toEqual(false);
  });
  it('handles undefined', () => {
    expect(isNumber(undefined)).toEqual(false);
  });
  it('handles NaN', () => {
    expect(isNumber(NaN)).toEqual(false);
  });
  it('handles non number', () => {
    expect(isNumber('0')).toEqual(false);
  });
  it('handles number 0', () => {
    expect(isNumber(0)).toEqual(true);
  });
  it('handles number', () => {
    expect(isNumber(3.421)).toEqual(true);
  });
});
