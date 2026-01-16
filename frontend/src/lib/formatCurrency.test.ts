import { describe, expect, it } from 'vitest';
import {
  abbreviateAddress,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from './formatCurrency';

describe('formatCurrency', () => {
  it('formats basic numbers with dollar sign and 2 decimals', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('handles bigint values', () => {
    expect(formatCurrency(1234n)).toBe('$1,234.00');
    expect(formatCurrency(1000000n)).toBe('$1,000,000.00');
  });

  it('supports custom decimal places', () => {
    expect(formatCurrency(1234.5678, { decimals: 4 })).toBe('$1,234.5678');
    expect(formatCurrency(1234.5, { decimals: 0 })).toBe('$1,235');
  });

  it('supports hiding the symbol', () => {
    expect(formatCurrency(1234.56, { showSymbol: false })).toBe('1,234.56');
  });

  it('supports custom symbol', () => {
    expect(formatCurrency(1234.56, { symbol: '€' })).toBe('€1,234.56');
  });

  describe('compact notation', () => {
    it('formats thousands with K suffix', () => {
      expect(formatCurrency(1500, { compact: true })).toBe('$1.50K');
      expect(formatCurrency(99999, { compact: true })).toBe('$100.00K');
    });

    it('formats millions with M suffix', () => {
      expect(formatCurrency(1500000, { compact: true })).toBe('$1.50M');
      expect(formatCurrency(2994773, { compact: true })).toBe('$2.99M');
    });

    it('formats billions with B suffix', () => {
      expect(formatCurrency(1500000000, { compact: true })).toBe('$1.50B');
    });

    it('formats trillions with T suffix', () => {
      expect(formatCurrency(1500000000000, { compact: true })).toBe('$1.50T');
    });

    it('handles negative values', () => {
      expect(formatCurrency(-1500000, { compact: true })).toBe('-$1.50M');
    });

    it('handles values below 1000 without suffix', () => {
      expect(formatCurrency(500, { compact: true })).toBe('$500.00');
    });
  });

  describe('minDisplay threshold', () => {
    it('shows < symbol for values below threshold', () => {
      expect(formatCurrency(0.005, { minDisplay: 0.01 })).toBe('$<0.01');
    });

    it('shows normal value at or above threshold', () => {
      expect(formatCurrency(0.01, { minDisplay: 0.01 })).toBe('$0.01');
      expect(formatCurrency(0.02, { minDisplay: 0.01 })).toBe('$0.02');
    });

    it('shows zero as zero, not as < threshold', () => {
      expect(formatCurrency(0, { minDisplay: 0.01 })).toBe('$0.00');
    });

    it('respects showSymbol option with minDisplay', () => {
      expect(formatCurrency(0.005, { minDisplay: 0.01, showSymbol: false })).toBe('<0.01');
    });
  });
});

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1234567.89)).toBe('1,234,567.89');
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('handles bigint values', () => {
    expect(formatNumber(1234567n)).toBe('1,234,567');
  });

  it('supports fixed decimal places', () => {
    expect(formatNumber(0.12345, { decimals: 4 })).toBe('0.1235');
    expect(formatNumber(100, { decimals: 2 })).toBe('100.00');
  });

  it('supports disabling grouping', () => {
    expect(formatNumber(1234567, { useGrouping: false })).toBe('1234567');
  });

  it('supports always showing sign', () => {
    expect(formatNumber(100, { signDisplay: 'always' })).toBe('+100');
    expect(formatNumber(-100, { signDisplay: 'always' })).toBe('-100');
  });

  it('supports never showing sign', () => {
    expect(formatNumber(-100, { signDisplay: 'never' })).toBe('100');
  });
});

describe('formatPercentage', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercentage(0.1234)).toBe('12.34%');
    expect(formatPercentage(0.5)).toBe('50.00%');
    expect(formatPercentage(1)).toBe('100.00%');
  });

  it('supports custom decimal places', () => {
    expect(formatPercentage(0.1234, { decimals: 1 })).toBe('12.3%');
    expect(formatPercentage(0.1234, { decimals: 0 })).toBe('12%');
  });

  it('handles negative percentages', () => {
    expect(formatPercentage(-0.05)).toBe('-5.00%');
  });

  it('supports always showing sign', () => {
    expect(formatPercentage(0.05, { signDisplay: 'always' })).toBe('+5.00%');
  });
});

describe('abbreviateAddress', () => {
  it('abbreviates long addresses', () => {
    expect(abbreviateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
  });

  it('returns short addresses unchanged', () => {
    expect(abbreviateAddress('0x1234')).toBe('0x1234');
    expect(abbreviateAddress('0x12345678')).toBe('0x12345678');
  });

  it('supports custom start and end chars', () => {
    expect(
      abbreviateAddress('0x1234567890abcdef1234567890abcdef12345678', {
        startChars: 10,
        endChars: 8,
      })
    ).toBe('0x12345678...12345678');
  });

  it('returns address at exact threshold length unchanged', () => {
    // 8 chars with 4+4=8 threshold returns unchanged
    expect(abbreviateAddress('0x123456', { startChars: 4, endChars: 4 })).toBe('0x123456');
  });
});
