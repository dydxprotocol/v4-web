import { style } from '@vanilla-extract/css';

export const positionField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
});

export const fieldLabel = style({
  fontSize: '0.625rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
  lineHeight: 1.2,
});

export const fieldValue = style({
  fontSize: '0.6875rem',
  color: '#e2e8f0',
  fontWeight: '500',
  fontFamily: 'monospace',
  lineHeight: 1.2,
});

export const profitPositive = style({
  color: '#22c55e',
});

export const profitNegative = style({
  color: '#ef4444',
});
