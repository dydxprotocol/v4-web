import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const root = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  backgroundColor: colors.whiteAlpha[5],
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  fontFamily: 'monospace',
});

export const icon = style({
  fontSize: '0.875rem',
});

export const label = style({
  color: colors.dustyGrey,
});

export const value = style({
  color: colors.snow,
  fontWeight: '500',
});

export const distance = style({
  color: colors.dustyGrey,
  fontSize: '0.6875rem',
});

export const warning = style({
  color: colors.error,
});

export const danger = style({
  color: colors.error,
});
