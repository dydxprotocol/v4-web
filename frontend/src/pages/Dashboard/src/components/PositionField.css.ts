import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const positionField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
});

export const fieldLabel = style({
  fontSize: '0.625rem',
  color: colors.dustyGrey,
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
  lineHeight: 1.2,
});

export const fieldValue = style({
  fontSize: '0.6875rem',
  color: colors.snow,
  fontWeight: '500',
  fontFamily: 'monospace',
  lineHeight: 1.2,
});

export const profitPositive = style({
  color: colors.success,
});

export const profitNegative = style({
  color: colors.error,
});
