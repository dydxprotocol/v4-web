import { describe, expect, it } from 'vitest';

import { OutputType, ShowSign, formatNumberOutput, getCompactNumberFormatter } from '../Output';

const localeOptions = {
  decimalSeparator: '.',
  groupSeparator: ',',
  selectedLocale: 'en-US',
};

describe('formatNumberOutput', () => {
  it('formats each numeric output without changing signs', () => {
    expect(formatNumberOutput(-1_234.5, OutputType.Fiat, localeOptions)).toBe('−$1,234.50');
    expect(
      formatNumberOutput(1_234.5, OutputType.Number, {
        ...localeOptions,
        fractionDigits: 1,
        showSign: ShowSign.Both,
      })
    ).toBe('+1,234.5');
    expect(formatNumberOutput(1_234, OutputType.CompactNumber, localeOptions)).toBe('1.23K');
  });
});

describe('getCompactNumberFormatter', () => {
  it('reuses formatters for the same locale and mode', () => {
    expect(getCompactNumberFormatter('en-US')).toBe(getCompactNumberFormatter('en-US'));
    expect(getCompactNumberFormatter('en-US', 'USD')).toBe(
      getCompactNumberFormatter('en-US', 'USD')
    );
    expect(getCompactNumberFormatter('en-US')).not.toBe(getCompactNumberFormatter('en-US', 'USD'));
  });
});
