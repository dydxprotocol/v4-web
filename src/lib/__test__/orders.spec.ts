import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';

import { SubaccountFill } from '@/constants/abacus';

import { getAverageFillPrice } from '../orders';

// TODO: add real SubaccountFill fixtures here, but `getAverageFillPrice` only uses 'size' and 'price' for now
const mockFill1 = { size: 1, price: 2 } as SubaccountFill;
const mockFill2 = { size: 0.5, price: 1 } as SubaccountFill;

const fraction = (num: number, denom: number) => {
  return BigNumber(num).div(BigNumber(denom));
};

describe('getAverageFillPrice', () => {
  it('doesnt error on empty arrays', () => {
    expect(getAverageFillPrice([])).toBeNull();
  });

  it('calculates single fill averages', () => {
    expect(getAverageFillPrice([mockFill1])).toEqual(BigNumber(2));
  });

  it('calculates averages', () => {
    expect(getAverageFillPrice([mockFill1, mockFill2])).toEqual(fraction(5, 3));
  });
});
