import { describe, expect, it } from 'vitest';

import { formatZeroNumbers } from '../formatZeroNumbers';

describe('formatZeroNumbers function', () => {
  it('should not compress zeros with and handle the absence of currency symbol', () => {
    expect(formatZeroNumbers('123.00', false)).toEqual({
      currencySign: undefined,
      significantDigits: '123',
      zeros: 0,
      decimalDigits: '00',
    });
    expect(formatZeroNumbers('123,00', false)).toEqual({
      currencySign: undefined,
      significantDigits: '123',
      zeros: 0,
      decimalDigits: '00',
    });
  });

  it('should not compress zeros even if there is a currency symbol', () => {
    expect(formatZeroNumbers('$0.00', true)).toEqual({
      currencySign: '$',
      significantDigits: '0',
      zeros: 0,
      decimalDigits: '00',
    });
    expect(formatZeroNumbers('$0,00', true)).toEqual({
      currencySign: '$',
      significantDigits: '0',
      zeros: 0,
      decimalDigits: '00',
    });
  });

  it('should correctly handle significant digits with leading zeros', () => {
    expect(formatZeroNumbers('$001.2300', true)).toEqual({
      currencySign: '$',
      significantDigits: '001',
      zeros: 0,
      decimalDigits: '2300',
    });
    expect(formatZeroNumbers('$001,2300', true)).toEqual({
      currencySign: '$',
      significantDigits: '001',
      zeros: 0,
      decimalDigits: '2300',
    });
  });

  it('should return original value if there are no zeros to compress', () => {
    expect(formatZeroNumbers('$123.45', true)).toEqual({
      currencySign: '$',
      significantDigits: '123',
      zeros: 0,
      decimalDigits: '45',
    });
    expect(formatZeroNumbers('$123,45', true)).toEqual({
      currencySign: '$',
      significantDigits: '123',
      zeros: 0,
      decimalDigits: '45',
    });
  });

  it('should correctly handle cases with only leading zeros less than the default threshold', () => {
    expect(formatZeroNumbers('$00.005', true)).toEqual({
      currencySign: '$',
      significantDigits: '00',
      zeros: 0,
      decimalDigits: '005',
    });
    expect(formatZeroNumbers('$00,005', true)).toEqual({
      currencySign: '$',
      significantDigits: '00',
      zeros: 0,
      decimalDigits: '005',
    });
  });

  it('should handle cases with no decimal part', () => {
    expect(formatZeroNumbers('$123', true)).toEqual({
      currencySign: '$',
      significantDigits: '123',
    });
    expect(formatZeroNumbers('$123', true)).toEqual({
      currencySign: '$',
      significantDigits: '123',
    });
  });

  it('should handle cases with no significant digits', () => {
    expect(formatZeroNumbers('$0.00', true)).toEqual({
      currencySign: '$',
      significantDigits: '0',
      zeros: 0,
      decimalDigits: '00',
    });
    expect(formatZeroNumbers('$0,00', true)).toEqual({
      currencySign: '$',
      significantDigits: '0',
      zeros: 0,
      decimalDigits: '00',
    });
  });
  it('should compress zeros with the default threshold', () => {
    expect(formatZeroNumbers('$0.00000029183', true)).toEqual({
      currencySign: '$',
      significantDigits: '0',
      zeros: 6,
      decimalDigits: '29183',
    });
    expect(formatZeroNumbers('$0,00000029183', true)).toEqual({
      currencySign: '$',
      significantDigits: '0',
      zeros: 6,
      decimalDigits: '29183',
    });
  });
  it('should not compress zeros with a different threshold', () => {
    expect(formatZeroNumbers('$1.000000323', true, 8)).toEqual({
      currencySign: '$',
      significantDigits: '1',
      zeros: 0,
      decimalDigits: '000000323',
    });
    expect(formatZeroNumbers('$1,000000323', true, 8)).toEqual({
      currencySign: '$',
      significantDigits: '1',
      zeros: 0,
      decimalDigits: '000000323',
    });
  });
  it('should compress zeros with a different threshold', () => {
    expect(formatZeroNumbers('$1.00000000323', true, 5)).toEqual({
      currencySign: '$',
      significantDigits: '1',
      zeros: 8,
      decimalDigits: '323',
    });
    expect(formatZeroNumbers('$1,00000000323', true, 5)).toEqual({
      currencySign: '$',
      significantDigits: '1',
      zeros: 8,
      decimalDigits: '323',
    });
  });
});
