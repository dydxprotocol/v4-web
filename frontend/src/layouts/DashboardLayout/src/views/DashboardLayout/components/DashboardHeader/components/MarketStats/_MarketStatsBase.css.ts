import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

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
