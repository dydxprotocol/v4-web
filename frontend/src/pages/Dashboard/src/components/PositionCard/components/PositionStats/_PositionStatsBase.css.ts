import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const statCell = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  minWidth: 0,
});

export const statLabel = style({
  fontSize: '0.5625rem',
  color: colors.dustyGrey,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  lineHeight: 1,
});

export const statValue = style({
  fontSize: '0.875rem',
  color: colors.snow,
  fontWeight: '600',
  fontFamily: 'monospace',
  lineHeight: 1.2,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const statValueSecondary = style({
  fontSize: '0.6875rem',
  color: colors.dustyGrey,
  fontWeight: '500',
  fontFamily: 'monospace',
});

export const statValueMuted = style({
  color: colors.dustyGrey,
});

export const statValuePositive = style({
  color: colors.success,
});

export const statValueNegative = style({
  color: colors.error,
});
