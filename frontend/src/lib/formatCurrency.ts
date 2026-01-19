/**
 * Global currency and number formatting utilities
 * Provides consistent, locale-aware formatting across the application
 *
 * Locale examples:
 * - en-US: $54,431.00
 * - de-DE: 54.431,00 $
 * - fr-FR: 54 431,00 $
 */

/**
 * Gets the user's locale from the browser, with fallback to 'en-US'
 */
function getUserLocale(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || 'en-US';
  }
  return 'en-US';
}

type FormatCurrencyOptions = {
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Whether to show the currency symbol (default: true) */
  showSymbol?: boolean;
  /** Currency symbol to display (default: '$') */
  symbol?: string;
  /** Whether to use compact notation for large numbers (default: false) */
  compact?: boolean;
  /** Minimum value to display, below which shows '<min' (default: undefined) */
  minDisplay?: number;
  /** Locale override (default: browser locale) */
  locale?: string;
};

/**
 * Formats a number as currency with locale-aware thousand separators
 *
 * @example
 * // With en-US locale (browser default)
 * formatCurrency(2994773) // "$2,994,773.00"
 * formatCurrency(2994773, { compact: true }) // "$2.99M"
 * formatCurrency(0.005, { decimals: 4 }) // "$0.0050"
 *
 * // With de-DE locale
 * formatCurrency(54431, { locale: 'de-DE' }) // "$54.431,00"
 * formatCurrency(1234.56, { locale: 'fr-FR' }) // "$1 234,56"
 */
export function formatCurrency(
  value: number | bigint,
  options: FormatCurrencyOptions = {}
): string {
  const {
    decimals = 2,
    showSymbol = true,
    symbol = '',
    compact = false,
    minDisplay,
    locale,
  } = options;

  const numValue = typeof value === 'bigint' ? Number(value) : value;

  // Handle minimum display threshold
  if (minDisplay !== undefined && numValue > 0 && numValue < minDisplay) {
    return `${showSymbol ? symbol : ''}<${minDisplay}`;
  }

  if (compact) {
    return formatCompactCurrency(numValue, { showSymbol, symbol, decimals, locale });
  }

  const formatted = new Intl.NumberFormat(locale ?? getUserLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);

  return showSymbol ? `${symbol}${formatted}` : formatted;
}

/**
 * Formats large numbers in compact notation (K, M, B, T)
 */
function formatCompactCurrency(
  value: number,
  options: { showSymbol: boolean; symbol: string; decimals: number; locale?: string }
): string {
  const { showSymbol, symbol, decimals, locale } = options;

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  let suffix = '';
  let divisor = 1;

  if (absValue >= 1_000_000_000_000) {
    suffix = 'T';
    divisor = 1_000_000_000_000;
  } else if (absValue >= 1_000_000_000) {
    suffix = 'B';
    divisor = 1_000_000_000;
  } else if (absValue >= 1_000_000) {
    suffix = 'M';
    divisor = 1_000_000;
  } else if (absValue >= 1_000) {
    suffix = 'K';
    divisor = 1_000;
  }

  const compactValue = absValue / divisor;
  // Use fewer decimals for compact notation, max 2
  const compactDecimals = Math.min(decimals, 2);
  const formatted = new Intl.NumberFormat(locale ?? getUserLocale(), {
    minimumFractionDigits: compactDecimals,
    maximumFractionDigits: compactDecimals,
  }).format(compactValue);

  return `${sign}${showSymbol ? symbol : ''}${formatted}${suffix}`;
}

type FormatNumberOptions = {
  /** Number of decimal places */
  decimals?: number;
  /** Whether to use thousand separators (default: true) */
  useGrouping?: boolean;
  /** Sign display: 'auto' | 'always' | 'never' (default: 'auto') */
  signDisplay?: 'auto' | 'always' | 'never';
  /** Locale override (default: browser locale) */
  locale?: string;
};

/**
 * Formats a number with locale-aware thousand separators
 *
 * @example
 * // With en-US locale (browser default)
 * formatNumber(1234567.89) // "1,234,567.89"
 * formatNumber(0.12345, { decimals: 4 }) // "0.1235"
 * formatNumber(100, { signDisplay: 'always' }) // "+100"
 *
 * // With de-DE locale
 * formatNumber(1234567.89, { locale: 'de-DE' }) // "1.234.567,89"
 */
export function formatNumber(value: number | bigint, options: FormatNumberOptions = {}): string {
  const { decimals, useGrouping = true, signDisplay = 'auto', locale } = options;

  const numValue = typeof value === 'bigint' ? Number(value) : value;

  const formatOptions: Intl.NumberFormatOptions = {
    useGrouping,
    signDisplay,
  };

  if (decimals !== undefined) {
    formatOptions.minimumFractionDigits = decimals;
    formatOptions.maximumFractionDigits = decimals;
  }

  return new Intl.NumberFormat(locale ?? getUserLocale(), formatOptions).format(numValue);
}

/**
 * Formats a percentage value with locale-aware formatting
 *
 * @example
 * // With en-US locale (browser default)
 * formatPercentage(0.1234) // "12.34%"
 * formatPercentage(0.1234, { decimals: 1 }) // "12.3%"
 * formatPercentage(-0.05, { signDisplay: 'always' }) // "-5.00%"
 *
 * // With de-DE locale
 * formatPercentage(0.1234, { locale: 'de-DE' }) // "12,34 %"
 */
export function formatPercentage(
  value: number,
  options: { decimals?: number; signDisplay?: 'auto' | 'always' | 'never'; locale?: string } = {}
): string {
  const { decimals = 2, signDisplay = 'auto', locale } = options;

  return new Intl.NumberFormat(locale ?? getUserLocale(), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay,
  }).format(value);
}

/**
 * Abbreviates a wallet address for display
 *
 * @example
 * abbreviateAddress("0x1234567890abcdef1234567890abcdef12345678") // "0x1234...5678"
 */
export function abbreviateAddress(
  address: string,
  options: { startChars?: number; endChars?: number } = {}
): string {
  const { startChars = 6, endChars = 4 } = options;

  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
