import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const container = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
});

export const assetSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
});

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

export const separator = style({
  width: '1px',
  height: '1.5rem',
  backgroundColor: colors.slateGrey,
});

export const statsSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
});

export const stat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
});

export const statLabel = style({
  fontSize: '0.625rem',
  color: colors.dustyGrey,
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
});

export const statValue = style({
  fontSize: '0.75rem',
  color: colors.snow,
  fontWeight: '500',
  fontFamily: 'monospace',
  lineHeight: 1.2,
});

export const statValuePositive = style({
  color: colors.success,
});

export const statValueNegative = style({
  color: colors.error,
});
