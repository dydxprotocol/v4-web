/**
 * Formats a number as USD with 2 decimal places and thousand separators.
 */
export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats a price value with 2 decimal places and thousand separators.
 */
export function formatPrice(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats PnL value with sign and dollar symbol.
 * Positive: "+$1,234.56", Negative: "-$1,234.56"
 */
export function formatPnl(value: number): string {
  const formatted = formatUsd(Math.abs(value));
  return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

/**
 * Formats a percentage value with sign and 2 decimal places.
 * Positive: "+12.34%", Negative: "-12.34%"
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Calculates PnL percentage based on PnL value and collateral.
 */
export function calculatePnlPercent(pnlValue: number, collateralValue: number): number {
  if (collateralValue === 0) return 0;
  return (pnlValue / collateralValue) * 100;
}

/**
 * Determines if a PnL value is profitable (>= 0).
 */
export function isProfitable(pnlValue: number): boolean {
  return pnlValue >= 0;
}
