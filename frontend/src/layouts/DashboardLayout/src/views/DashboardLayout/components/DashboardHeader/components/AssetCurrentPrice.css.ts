import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const priceDisplay = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.5rem',
});

export const price = style({
  fontSize: '1rem',
  fontWeight: '600',
  color: colors.snow,
  fontFamily: 'monospace',
});

export const priceChange = style({
  fontSize: '0.75rem',
  fontWeight: '500',
  fontFamily: 'monospace',
});

export const priceChangePositive = style({
  color: colors.success,
});

export const priceChangeNegative = style({
  color: colors.error,
});
