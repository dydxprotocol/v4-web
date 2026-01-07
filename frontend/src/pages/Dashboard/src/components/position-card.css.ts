import { style } from '@vanilla-extract/css';

export const positionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.5rem',
  rowGap: '0.375rem',
});

export const positionCard = style({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.5rem',
  padding: '0.625rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s',
  flexShrink: 0,
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export const positionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
});

export const positionSide = style({
  padding: '0.125rem 0.5rem',
  borderRadius: '0.25rem',
  fontSize: '0.6875rem',
  fontWeight: '600',
  letterSpacing: '0.025em',
});

export const longPosition = style({
  backgroundColor: 'rgba(34, 197, 94, 0.2)',
  color: '#22c55e',
});

export const shortPosition = style({
  backgroundColor: 'rgba(239, 68, 68, 0.2)',
  color: '#ef4444',
});

export const fieldValue = style({
  fontSize: '0.6875rem',
  color: '#e2e8f0',
  fontWeight: '500',
  fontFamily: 'monospace',
});
